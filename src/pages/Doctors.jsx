import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getCalendarAppointments, getAppointmentsByDoctorID, getAppointmentsByFilters, createPrescription, getPrescriptionsByAppointment, updateAppointment, addPrescription, updatePrescriptionData, getPrescriptionById, addPatientVisit } from "../services/appointmentService";
import { visitService, prescriptionService } from "../services/visitService";
import { createInventoryMaster, listInventoryMasters } from "../services/inventoryService";
import PrescriptionWritingModal from "../components/PrescriptionWritingModal";
import PrescriptionPrint from "../components/PrescriptionPrint";
import { getPatientFullProfile, getPatientVisit, editPatientVisit } from "../services/patientService";

// Sample data
const SAMPLE_CLINIC_DETAILS = {
  clinicName: "Dentaesthetics Mumbai Central",
  address: "Shop 12, Andheri West, Near Metro Station, Mumbai, MH 400053",
  phone: "+91 98765 43210",
  email: "contact@dentaestheticsmumbai.com",
  operatingHours: "Mon-Fri 9:00 AM - 6:00 PM",
  totalStaff: 12,
  activeDoctors: 4,
  chairsAvailable: 8,
  todayAppointments: 12,
  pendingPayments: 3
};

const SAMPLE_PATIENTS = [
  { id: 1, name: "Priya Sharma", status: "Active", lastVisit: "2025-11-10", nextAppt: "2025-11-20", balance: 0 },
  { id: 2, name: "Arjun Patel", status: "Active", lastVisit: "2025-11-08", nextAppt: "2025-11-22", balance: 20750 },
  { id: 3, name: "Anjali Reddy", status: "Active", lastVisit: "2025-11-05", nextAppt: "2025-11-25", balance: 0 },
  { id: 4, name: "Vikram Singh", status: "Pending", lastVisit: "2025-10-28", nextAppt: "2025-12-01", balance: 41500 },
  { id: 5, name: "Kavya Menon", status: "Active", lastVisit: "2025-11-12", nextAppt: "2025-11-18", balance: 12450 }
];

const SAMPLE_PAYMENTS = [
  { id: 1, patient: "Priya Sharma", amount: 29050, status: "Paid", date: "2025-11-10", method: "Insurance" },
  { id: 2, patient: "Arjun Patel", amount: 20750, status: "Pending", date: "2025-11-08", method: "Credit Card" },
  { id: 3, patient: "Anjali Reddy", amount: 37350, status: "Paid", date: "2025-11-05", method: "Cash" },
  { id: 4, patient: "Vikram Singh", amount: 41500, status: "Overdue", date: "2025-10-28", method: "Insurance" },
  { id: 5, patient: "Kavya Menon", amount: 12450, status: "Pending", date: "2025-11-12", method: "UPI" }
];

const SAMPLE_APPOINTMENTS = [
  { id: 1, patient: "Priya Sharma", date: "2025-11-20", time: "10:00 AM", type: "Cleaning", status: "Confirmed" },
  { id: 2, patient: "Arjun Patel", date: "2025-11-22", time: "2:00 PM", type: "Root Canal", status: "Confirmed" },
  { id: 3, patient: "Anjali Reddy", date: "2025-11-25", time: "11:00 AM", type: "Filling", status: "Confirmed" },
  { id: 4, patient: "Rahul Verma", date: "2025-11-18", time: "9:00 AM", type: "Checkup", status: "Cancelled" },
  { id: 5, patient: "Kavya Menon", date: "2025-11-18", time: "3:00 PM", type: "Crown", status: "Confirmed" }
];

const SAMPLE_INVENTORY = [
  { id: 1, item: "Dental Gloves (Box)", category: "Supplies", available: 120, ordered: 0, status: "In Stock", reorderLevel: 50 },
  { id: 2, item: "Anesthetic Cartridges", category: "Medication", available: 35, ordered: 100, status: "Low Stock", reorderLevel: 40 },
  { id: 3, item: "Composite Resin", category: "Materials", available: 8, ordered: 20, status: "Critical", reorderLevel: 10 },
  { id: 4, item: "Surgical Masks (Box)", category: "Supplies", available: 200, ordered: 0, status: "In Stock", reorderLevel: 80 },
  { id: 5, item: "X-Ray Film", category: "Equipment", available: 150, ordered: 0, status: "In Stock", reorderLevel: 60 },
  { id: 6, item: "Sterile Needles", category: "Supplies", available: 25, ordered: 50, status: "Low Stock", reorderLevel: 30 }
];

export default function Doctors() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSection, setActiveSection] = useState("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isDashboardExpanded, setIsDashboardExpanded] = useState(false);
  const [isManageExpanded, setIsManageExpanded] = useState(false);
  
  // Appointments management states
  const [appointments, setAppointments] = useState(SAMPLE_APPOINTMENTS);
  const [realAppointments, setRealAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedAppointmentForVisit, setSelectedAppointmentForVisit] = useState(null);
  const [showVisitInfoModal, setShowVisitInfoModal] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewingMyAppointments, setViewingMyAppointments] = useState(false);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    medications: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
  });
  const [savedPrescription, setSavedPrescription] = useState(null);
  const [prescriptionId, setPrescriptionId] = useState(null);
  const [viewedPrescription, setViewedPrescription] = useState(null);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  
  // Inline prescription states
  const [inlineMedications, setInlineMedications] = useState([]);
  const [currentMedication, setCurrentMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });
  const [editingMedicationIndex, setEditingMedicationIndex] = useState(null);
  const [inventoryMeds, setInventoryMeds] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [medicineDropdownOpen, setMedicineDropdownOpen] = useState(false);
  const medicineInputRef = useRef(null);
  const [showMedicationDropdown, setShowMedicationDropdown] = useState(false);
  const medicationDropdownRef = useRef(null);
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [showMedicineSaveSuccess, setShowMedicineSaveSuccess] = useState(false);
  const [medicineSaveMessage, setMedicineSaveMessage] = useState('');
  const [showPrescriptionPreview, setShowPrescriptionPreview] = useState(false);
  const [newMedicineForm, setNewMedicineForm] = useState({
    itemName: '',
    itemCode: '',
    category: 'Medicines',
    subCategory: 'General',
    unit: 'tablet'
  });
  const [showAddMedicationModal, setShowAddMedicationModal] = useState(false);
  const [newMedicationName, setNewMedicationName] = useState('');
  const [currentMedicationIndex, setCurrentMedicationIndex] = useState(-1);
  const [showViewPrescriptionModal, setShowViewPrescriptionModal] = useState(false);
  const [showPrescriptionSuccessModal, setShowPrescriptionSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDiagnosisSaveSuccess, setShowDiagnosisSaveSuccess] = useState(false);
  const [diagnosisSaveMessage, setDiagnosisSaveMessage] = useState('');
  const [printPrescriptionData, setPrintPrescriptionData] = useState(null);

  // Debug logging for currentMedication state changes
  useEffect(() => {
    console.log('🔄 STATE CHANGE - currentMedication.name:', currentMedication.name);
    console.log('🔄 STATE CHANGE - currentMedication FULL:', JSON.stringify(currentMedication, null, 2));
  }, [currentMedication]);

  // Debug logging for inlineMedications changes
  useEffect(() => {
    console.log('📋 STATE CHANGE - inlineMedications count:', inlineMedications.length);
    console.log('📋 STATE CHANGE - inlineMedications FULL:', JSON.stringify(inlineMedications, null, 2));
  }, [inlineMedications]);

  // Debug logging for dropdown state
  useEffect(() => {
    console.log('🔽 STATE CHANGE - medicineDropdownOpen:', medicineDropdownOpen);
  }, [medicineDropdownOpen]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [editAction, setEditAction] = useState(""); // "cancel" or "reschedule"
  const [rescheduleData, setRescheduleData] = useState({ date: "", time: "" });
  
  // Prescription management states
  const [showPrescriptionWritingModal, setShowPrescriptionWritingModal] = useState(false);
  const [patientMedicalInfo, setPatientMedicalInfo] = useState(null);
  const [currentPrescription, setCurrentPrescription] = useState(null);
  const [showPrescriptionPrintModal, setShowPrescriptionPrintModal] = useState(false);
  const [prescriptionToPrint, setPrescriptionToPrint] = useState(null);
  const printRef = useRef(null);
  
  // Edit appointment states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isUpdatingAppointment, setIsUpdatingAppointment] = useState(false);
  const [showUpdateSuccessModal, setShowUpdateSuccessModal] = useState(false);
  const [updateSuccessMessage, setUpdateSuccessMessage] = useState("");
  const [activeEditSection, setActiveEditSection] = useState('patient');
  
  // New appointment booking states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    patient: "",
    date: "",
    time: "",
    type: "",
    doctor: "",
    notes: "",
    phone: "",
    email: ""
  });
  
  // Inventory management states
  const [inventoryItems, setInventoryItems] = useState(SAMPLE_INVENTORY);
  const [newItems, setNewItems] = useState([]);
  const [orderModalOpen, setOrderModalOpen] = useState(false);
  const [orderItem, setOrderItem] = useState(null);
  const [orderQuantity, setOrderQuantity] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  
  const vendors = [
    "MedSupply Co.",
    "Dental Solutions Ltd.",
    "Healthcare Partners Inc.",
    "Premier Medical Supplies",
    "Global Dental Equipment"
  ];
  
  // Appointment management functions
  const handleEditAppointmentClick = (appointment) => {
    setEditFormData({ ...appointment });
    setActiveEditSection('patient'); // Reset to first tab
    setShowEditModal(true);
  };
  
  const handleUpdateAppointmentSubmit = async () => {
    if (!editFormData) return;
    
    setIsUpdatingAppointment(true);
    try {
      // Call the API to update the appointment
      await updateAppointment(editFormData);
      
      // Update local state
      setAppointments(appointments.map(appt => 
        appt.appointmentId === editFormData.appointmentId 
          ? editFormData
          : appt
      ));
      
      // Show success modal
      setUpdateSuccessMessage("🎉 Appointment updated successfully! Your changes have been saved to the system.");
      setShowUpdateSuccessModal(true);
      
      // Close edit modal
      setShowEditModal(false);
      setEditFormData(null);
    } catch (error) {
      console.error("Error updating appointment:", error);
      alert("❌ Failed to update appointment. Please try again.");
    } finally {
      setIsUpdatingAppointment(false);
    }
  };
  
  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setEditAction("");
    setRescheduleData({ date: appointment.date, time: appointment.time });
    setEditModalOpen(true);
  };
  
  const handleCancelAppointment = () => {
    if (selectedAppointment) {
      setAppointments(appointments.map(appt => 
        appt.id === selectedAppointment.id 
          ? { ...appt, status: "Cancelled" }
          : appt
      ));
      setEditModalOpen(false);
      setSelectedAppointment(null);
      setEditAction("");
    }
  };
  
  const handleRescheduleAppointment = () => {
    if (selectedAppointment && rescheduleData.date && rescheduleData.time) {
      setAppointments(appointments.map(appt => 
        appt.id === selectedAppointment.id 
          ? { ...appt, date: rescheduleData.date, time: rescheduleData.time, status: "Confirmed" }
          : appt
      ));
      setEditModalOpen(false);
      setSelectedAppointment(null);
      setEditAction("");
      setRescheduleData({ date: "", time: "" });
    }
  };
  
  // Close medicine dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (medicineInputRef.current && !medicineInputRef.current.contains(event.target)) {
        setMedicineDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // New appointment booking functions
  const handleOpenBooking = () => {
    setBookingModalOpen(true);
    setNewAppointment({
      patient: "",
      date: "",
      time: "",
      type: "",
      doctor: "",
      notes: "",
      phone: "",
      email: ""
    });
  };
  
  const handleBookAppointment = () => {
    if (newAppointment.patient && newAppointment.date && newAppointment.time && newAppointment.type) {
      const appointment = {
        id: appointments.length + 1,
        patient: newAppointment.patient,
        date: newAppointment.date,
        time: newAppointment.time,
        type: newAppointment.type,
        status: "Confirmed"
      };
      setAppointments([...appointments, appointment]);
      setBookingModalOpen(false);
      setNewAppointment({
        patient: "",
        date: "",
        time: "",
        type: "",
        doctor: "",
        notes: "",
        phone: "",
        email: ""
      });
      alert("✅ Appointment booked successfully!");
    } else {
      alert("❌ Please fill in all required fields");
    }
  };
  
  const handleAddNewItem = () => {
    setNewItems([...newItems, { tempId: Date.now(), item: "", category: "", available: "", reorderLevel: "" }]);
  };
  
  const handleNewItemChange = (tempId, field, value) => {
    setNewItems(newItems.map(item => 
      item.tempId === tempId ? { ...item, [field]: value } : item
    ));
  };
  
  const handleSaveNewItems = () => {
    const validItems = newItems.filter(item => item.item && item.category && item.available);
    if (validItems.length > 0) {
      const itemsToAdd = validItems.map((item, index) => ({
        id: inventoryItems.length + index + 1,
        item: item.item,
        category: item.category,
        available: parseInt(item.available) || 0,
        ordered: 0,
        reorderLevel: parseInt(item.reorderLevel) || 10,
        status: "In Stock"
      }));
      setInventoryItems([...inventoryItems, ...itemsToAdd]);
      setNewItems([]);
    }
  };
  
  const handlePlaceOrder = (item) => {
    setOrderItem(item);
    setOrderQuantity("");
    setSelectedVendor("");
    setOrderModalOpen(true);
  };
  
  const handleConfirmOrder = () => {
    if (orderItem && orderQuantity && selectedVendor) {
      // Update the inventory item with ordered quantity
      setInventoryItems(inventoryItems.map(item => 
        item.id === orderItem.id 
          ? { ...item, ordered: (item.ordered || 0) + parseInt(orderQuantity), status: "In Stock" }
          : item
      ));
      setOrderModalOpen(false);
      setSuccessModalOpen(true);
    }
  };

  // Prescription handlers
  const handleOpenPrescriptionModal = async (appointment) => {
    try {
      console.log('🔓 Opening prescription modal with appointment:', appointment);
      setSelectedAppointmentDetails(appointment);
      // Load patient medical info only
      const patientData = await getPatientFullProfile(appointment.patientId);
      setPatientMedicalInfo(patientData.patientMedicalInfo);
      setShowPrescriptionWritingModal(true);
    } catch (error) {
      console.error("Failed to load patient data:", error);
      // Still open modal - user can write prescription
      setShowPrescriptionWritingModal(true);
    }
  };

  // Inline Prescription Handlers
  const loadInventoryMedications = async () => {
    console.log('🔄 Starting to load inventory medications...');
    setLoadingMeds(true);
    try {
      const data = await listInventoryMasters();
      console.log('✅ Inventory medications loaded:', data?.length, 'items', data);
      setInventoryMeds(data || []);
    } catch (error) {
      console.error("❌ Failed to load medications:", error);
      setInventoryMeds([]);
    } finally {
      setLoadingMeds(false);
    }
  };

  useEffect(() => {
    if (showVisitInfoModal) {
      console.log('🏥 Visit Info Modal opened, loading inventory medications...');
      loadInventoryMedications();
    }
  }, [showVisitInfoModal]);

  const handleAddMedication = useCallback(() => {
    console.log('➕ Attempting to add medication:', currentMedication);
    if (!currentMedication.name || !currentMedication.dosage || !currentMedication.frequency || !currentMedication.duration) {
      alert('❌ Please fill in all required fields (Name, Dosage, Frequency, Duration)');
      return;
    }

    if (editingMedicationIndex !== null) {
      // Update existing medication
      const updated = [...inlineMedications];
      updated[editingMedicationIndex] = { ...currentMedication };
      setInlineMedications(updated);
      console.log('✏️ Updated medication at index', editingMedicationIndex, ':', updated[editingMedicationIndex]);
      console.log('📋 Total medications after update:', updated.length);
      setEditingMedicationIndex(null);
    } else {
      // Add new medication
      const newMeds = [...inlineMedications, { ...currentMedication }];
      setInlineMedications(newMeds);
      console.log('✅ Added new medication. Total count:', newMeds.length);
      console.log('📋 Current medications list:', newMeds);
    }

    // Reset form
    setCurrentMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
    setShowMedicationDropdown(false);
  }, [currentMedication, editingMedicationIndex, inlineMedications]);

  const handleEditMedication = useCallback((index) => {
    setCurrentMedication({ ...inlineMedications[index] });
    setEditingMedicationIndex(index);
  }, [inlineMedications]);

  const handleRemoveMedication = useCallback((index) => {
    setInlineMedications(inlineMedications.filter((_, i) => i !== index));
  }, [inlineMedications]);

  const handleCancelEdit = useCallback(() => {
    setCurrentMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
    setEditingMedicationIndex(null);
    setShowMedicationDropdown(false);
  }, []);

  const handleAddNewMedicine = useCallback(async () => {
    if (!newMedicineForm.itemName || !newMedicineForm.itemCode) {
      const warningMessages = [
        '🤔 Hold up! We need a name and code for this medicine!',
        '⚠️ Whoa there! Medicine name and code are mandatory!',
        '🚫 Not so fast! Fill in the name and code first!'
      ];
      setMedicineSaveMessage(warningMessages[Math.floor(Math.random() * warningMessages.length)]);
      setShowMedicineSaveSuccess(true);
      return;
    }

    try {
      // Create the new medicine in inventory
      const newMed = await createInventoryMaster({
        itemName: newMedicineForm.itemName,
        itemCode: newMedicineForm.itemCode,
        category: newMedicineForm.category,
        subCategory: newMedicineForm.subCategory,
        unit: newMedicineForm.unit,
        isActive: true
      });

      console.log('✅ New medicine created:', newMed);

      // Reload inventory to get the latest list
      await loadInventoryMedications();
      
      // Auto-select the newly added medicine in the current medication form
      setCurrentMedication(prev => ({
        ...prev,
        name: newMed.itemName || newMedicineForm.itemName
      }));
      
      // Close the modal
      setShowAddMedicineModal(false);
      
      // Reset the form for next use
      setNewMedicineForm({
        itemName: '',
        itemCode: '',
        category: 'Medicines',
        subCategory: 'General',
        unit: 'tablet'
      });
      
      // Show success modal with funny message
      const funnyMessages = [
        `🎉 Boom! ${newMed.itemName || newMedicineForm.itemName} joined the medicine gang!`,
        `💊 Cha-ching! ${newMed.itemName || newMedicineForm.itemName} is now in your arsenal!`,
        `✨ Wham! ${newMed.itemName || newMedicineForm.itemName} is locked and loaded!`,
        `🎯 Bullseye! ${newMed.itemName || newMedicineForm.itemName} is ready for action!`,
        `🚀 ${newMed.itemName || newMedicineForm.itemName} launched into inventory at warp speed!`,
        `🏆 Victory! ${newMed.itemName || newMedicineForm.itemName} is standing by!`,
        `⭐ Sweet! ${newMed.itemName || newMedicineForm.itemName} has entered the chat!`
      ];
      const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      setMedicineSaveMessage(randomMessage);
      setShowMedicineSaveSuccess(true);
      
      // Focus back on the diagnosis form
      setShowMedicationDropdown(false);
      
    } catch (error) {
      console.error('Failed to add medicine:', error);
      setMedicineSaveMessage('❌ Failed to add medicine to inventory. Please try again.');
      setShowMedicineSaveSuccess(true);
    }
  }, [newMedicineForm, loadInventoryMedications]);

  // Memoized handler for medication selection
  const handleMedicationSelect = useCallback((medicineItem) => {
    setCurrentMedication(prev => ({ ...prev, name: medicineItem.itemName }));
    setShowMedicationDropdown(false);
  }, []);

  // Medicine name handler - updates immediately for dropdown search
  const handleMedicationNameChange = useCallback((value) => {
    console.log('🔵 Medicine name changing:', value);
    setCurrentMedication(prev => ({ ...prev, name: value }));
    setShowMedicationDropdown(true); // Always show dropdown when typing
  }, []);

  // Blur handlers - only update state when user finishes typing (on blur)
  const handleDosageBlur = useCallback((value) => {
    console.log('🟢 Dosage finalized:', value);
    setCurrentMedication(prev => ({ ...prev, dosage: value }));
  }, []);

  const handleDurationBlur = useCallback((value) => {
    console.log('🟠 Duration finalized:', value);
    setCurrentMedication(prev => ({ ...prev, duration: value }));
  }, []);

  const handleInstructionsBlur = useCallback((value) => {
    console.log('🟣 Instructions finalized:', value);
    setCurrentMedication(prev => ({ ...prev, instructions: value }));
  }, []);

  // Frequency handler - updates immediately (dropdown selection)
  const handleFrequencyChange = useCallback((value) => {
    console.log('🟡 Frequency selected:', value);
    setCurrentMedication(prev => ({ ...prev, frequency: value }));
  }, []);

  // Memoized handler to open add medicine modal
  const handleOpenAddMedicineModal = useCallback((medicineItemName = '') => {
    setNewMedicineForm({
      itemName: medicineItemName || currentMedication.name,
      itemCode: '',
      category: 'Medicines',
      subCategory: 'General',
      unit: 'tablet'
    });
    setShowAddMedicineModal(true);
    setShowMedicationDropdown(false);
  }, [currentMedication.name]);

  // SIMPLE INLINE FORM - NO NESTED COMPONENT
  // Medication form is now inline in the JSX for simpler state management
  // Removed renderMedicationForm function to prevent closure issues
  
  const renderMedicationFormOLD_UNUSED = () => {
    return (
    <div className="bg-white rounded-xl p-5 mb-5 border-2 border-purple-200">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Medicine Name Searchable Dropdown */}
        <div className="md:col-span-2" ref={medicineInputRef}>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            Medicine Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={currentMedication.name || ""}
              onChange={(e) => {
                setCurrentMedication(prev => ({ ...prev, name: e.target.value }));
                if (!medicineDropdownOpen) setMedicineDropdownOpen(true);
              }}
              onFocus={() => {
                if (inventoryMeds.length === 0 && !loadingMeds) {
                  loadInventoryMedications();
                }
                setMedicineDropdownOpen(true);
              }}
              placeholder="Search or type medication name..."
              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              autoComplete="off"
            />
            {currentMedication.name && !medicineDropdownOpen && (
              <div className="mt-1 px-3 py-2 bg-green-50 border border-green-300 rounded-lg text-sm">
                <span className="text-green-700">✓ Selected:</span> <span className="font-bold text-stone-900">{currentMedication.name}</span>
              </div>
            )}
            
            {/* Dropdown Panel */}
            {medicineDropdownOpen && (
              <div className="absolute z-30 mt-1 w-full bg-white border-2 border-purple-200 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                {loadingMeds ? (
                  <div className="px-3 py-8 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                    <p className="text-sm text-stone-600 font-medium">Loading medicines...</p>
                  </div>
                ) : inventoryMeds.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-sm text-stone-600 mb-4">No medicines in inventory. Add one to get started!</p>
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenAddMedicineModal(currentMedication.name);
                        setMedicineDropdownOpen(false);
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add to Inventory
                    </button>
                  </div>
                ) : (
                  <>
                    {inventoryMeds
                      .filter(med => {
                        const searchVal = (currentMedication.name || "").toLowerCase();
                        return !searchVal || med.itemName?.toLowerCase().includes(searchVal) || med.itemCode?.toLowerCase().includes(searchVal);
                      })
                      .map((m) => (
                      <button
                        type="button"
                        key={m.itemId || m.id}
                        onClick={() => {
                          setCurrentMedication(prev => ({ ...prev, name: m.itemName }));
                          setMedicineDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition border-b border-purple-50 last:border-b-0 focus:outline-none focus:bg-purple-100"
                      >
                        <div className="font-semibold text-stone-800">{m.itemName}{m.itemCode ? ` (${m.itemCode})` : ""}</div>
                        <div className="text-xs text-stone-500 flex gap-3 flex-wrap">
                          {m.category && <span>Category: {m.category}</span>}
                          {m.unit && <span>Unit: {m.unit}</span>}
                        </div>
                      </button>
                    ))}
                    {/* Add New Medicine Button at Bottom */}
                    <div className="sticky bottom-0 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 border-t border-purple-200">
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenAddMedicineModal(currentMedication.name);
                          setMedicineDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add New Medicine
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dosage */}
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Dosage <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={currentMedication.dosage || ""}
            onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))}
            placeholder="e.g., 500mg, 1 tablet"
            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            autoComplete="off"
          />
        </div>

        {/* Frequency */}
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Frequency <span className="text-red-500">*</span>
          </label>
          <select
            value={currentMedication.frequency || ""}
            onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))}
            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
          >
            <option value="">Select frequency...</option>
            <option value="Once daily">Once daily</option>
            <option value="Twice daily">Twice daily</option>
            <option value="Three times daily">Three times daily</option>
            <option value="Four times daily">Four times daily</option>
            <option value="Every 4 hours">Every 4 hours</option>
            <option value="Every 6 hours">Every 6 hours</option>
            <option value="Every 8 hours">Every 8 hours</option>
            <option value="Every 12 hours">Every 12 hours</option>
            <option value="Before meals">Before meals</option>
            <option value="After meals">After meals</option>
            <option value="At bedtime">At bedtime</option>
            <option value="As needed">As needed</option>
          </select>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Duration <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={currentMedication.duration || ""}
            onChange={(e) => setCurrentMedication(prev => ({ ...prev, duration: e.target.value }))}
            placeholder="e.g., 7 days, 2 weeks"
            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            autoComplete="off"
          />
        </div>

        {/* Instructions */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-stone-700 mb-2">
            Special Instructions
          </label>
          <input
            type="text"
            value={currentMedication.instructions || ""}
            onChange={(e) => setCurrentMedication(prev => ({ ...prev, instructions: e.target.value }))}
            placeholder="e.g., Take with food, Avoid alcohol"
            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Add/Update Button */}
      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddMedication}
          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
        >
          <span>{editingMedicationIndex !== null ? '✏️' : '➕'}</span>
          <span>{editingMedicationIndex !== null ? 'Update Medication' : 'Add Medication'}</span>
        </motion.button>
        {editingMedicationIndex !== null && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleCancelEdit}
            className="px-6 py-2 bg-gray-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition"
          >
            Cancel
          </motion.button>
        )}
      </div>
    </div>
    );
  };

  const handleSaveAllPrescriptions = async () => {
    if (inlineMedications.length === 0) {
      alert('❌ Please add at least one medication');
      return;
    }

    try {
      const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const appointmentDetails = selectedAppointmentForVisit;

      const enterpriseId = parseInt(selectedAccess.enterpriseId || 0);
      const clinicId = parseInt(selectedAccess.clinicId || 0);
      const appointmentIdNum = parseInt(appointmentDetails?.appointmentId || 0);
      const doctorId = parseInt(appointmentDetails?.doctorId || 0);
      const patientId = parseInt(appointmentDetails?.patientId || 0);
      const visitId = parseInt(appointmentDetails?.visitId || 0);

      if (enterpriseId === 0 || clinicId === 0 || appointmentIdNum === 0 || doctorId === 0) {
        alert('❌ Missing required IDs to save prescription');
        return;
      }

      const now = new Date().toISOString();
      const savedPrescriptions = [];

      for (const med of inlineMedications) {
        const payload = {
          medicationId: 0,
          enterpriseId: enterpriseId,
          clinicId: clinicId,
          appointmentId: appointmentIdNum,
          visitId: visitId,
          doctorId: doctorId,
          patientId: patientId,
          medicineName: String(med.name).trim(),
          dosage: String(med.dosage).trim(),
          frequency: String(med.frequency).trim(),
          duration: String(med.duration).trim(),
          specialInstructions: String(med.instructions || "").trim(),
          generalPrescriptionNotes: "",
          createdAt: now,
          createdBy: String(userData.username || userData.fullName || "Doctor").trim(),
          updatedAt: now,
          updatedBy: String(userData.username || userData.fullName || "Doctor").trim()
        };

        const result = await addPrescription(payload);
        savedPrescriptions.push(result);
        
        // Capture first prescription ID
        if (savedPrescriptions.length === 1 && result.prescriptionId) {
          setPrescriptionId(result.prescriptionId);
        }
      }

      const funnyMessages = [
        "🎉 Medications saved! The germs don't stand a chance!",
        "💊 Success! Prescription documented and ready to heal!",
        "✅ Boom! All medications saved to the system!",
        "🏥 Perfect! Your prescription is now part of medical history!",
        "📋 Done! Medications locked and loaded!",
        "💉 Nailed it! Prescription saved successfully!",
        "🎯 Medications saved with precision! Well done!",
        "🚀 Prescription entered at warp speed! All set!"
      ];
      
      const funnyMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      alert(funnyMessage);

      // Update visit form prescriptions field
      const prescriptionText = inlineMedications
        .map(med => `${med.name} - ${med.dosage} ${med.frequency} for ${med.duration}${med.instructions ? ` (${med.instructions})` : ""}`)
        .join("\n");
      
      handleVisitFormChange('prescriptions', prescriptionText);

      // Clear inline medications after successful save
      setInlineMedications([]);
      
    } catch (error) {
      console.error('Failed to save prescriptions:', error);
      alert('❌ Failed to save prescriptions. Please try again.');
    }
  };

  const handleSavePrescription = async (prescriptionData) => {
    try {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const doctorInfo = {
        doctorId: userData.doctorId || 0,
        doctorName: userData.username || "Doctor",
        registrationNumber: userData.registrationNumber || ""
      };

      // Create prescription record with the old endpoint for compatibility
      await createPrescription({
        visitId: 0,
        ...prescriptionData,
        ...doctorInfo
      });

      // Store prescription data for viewing/editing
      setCurrentPrescription(prescriptionData);
      setShowPrescriptionWritingModal(false);

      // Show the success message from the modal
      if (prescriptionData.successMessage) {
        // Already shown in modal, no need to show again
      }

      // Redirect back to the diagnosis/visit form so user can continue
      setShowVisitInfoModal(true);
    } catch (error) {
      console.error("Failed to save prescription:", error);
      throw error;
    }
  };

  const handlePrintPrescription = () => {
    if (currentPrescription) {
      setPrescriptionToPrint(currentPrescription);
      setShowPrescriptionPrintModal(true);
    } else {
      alert("❌ No prescription found to print");
    }
  };

  const dashboardTabs = [
    { key: "overview", label: "Overview", icon: "📊", gradient: "from-indigo-500 to-purple-600" },
    { key: "clinic", label: "Clinic Details", icon: "🏥", gradient: "from-teal-500 to-cyan-600" },
    { key: "patients", label: "My Patients", icon: "👥", gradient: "from-blue-500 to-indigo-600" },
    { key: "payments", label: "Payments", icon: "💳", gradient: "from-emerald-500 to-teal-600" },
    { key: "appointments", label: "Appointments", icon: "📅", gradient: "from-violet-500 to-purple-600" },
    { key: "inventory", label: "Inventory", icon: "📦", gradient: "from-amber-500 to-orange-600" }
  ];

  const manageClinicTabs = [
    { key: "settings", label: "Clinic Settings", icon: "⚙️", gradient: "from-slate-500 to-stone-600" },
    { key: "staff", label: "Staff Management", icon: "👔", gradient: "from-blue-500 to-indigo-600" },
    { key: "schedule", label: "Schedule & Hours", icon: "🗓️", gradient: "from-violet-500 to-purple-600" },
    { key: "billing", label: "Billing & Insurance", icon: "💰", gradient: "from-emerald-500 to-teal-600" },
    { key: "reports", label: "Reports & Analytics", icon: "📈", gradient: "from-orange-500 to-red-600" },
    { key: "equipment", label: "Equipment & Assets", icon: "🔧", gradient: "from-amber-500 to-orange-600" }
  ];

  const tabs = activeSection === "dashboard" ? dashboardTabs : manageClinicTabs;

  const getStatusColor = (status) => {
    const colors = {
      "Active": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Pending": "bg-amber-100 text-amber-700 border-amber-200",
      "Paid": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Overdue": "bg-rose-100 text-rose-700 border-rose-200",
      "Confirmed": "bg-blue-100 text-blue-700 border-blue-200",
      "Cancelled": "bg-stone-200 text-stone-600 border-stone-300",
      "In Stock": "bg-emerald-100 text-emerald-700 border-emerald-200",
      "Low Stock": "bg-amber-100 text-amber-700 border-amber-200",
      "Critical": "bg-rose-100 text-rose-700 border-rose-200"
    };
    return colors[status] || "bg-stone-100 text-stone-600 border-stone-200";
  };

  // Load real appointments when appointments tab is active
  useEffect(() => {
    if (activeSection === "dashboard" && activeTab === "appointments") {
      loadAllAppointments();
    }
  }, [activeSection, activeTab, appointmentDate]); // FIXED: Only when these change

  const loadAllAppointments = useCallback(() => {
    setLoadingAppointments(true);
    setViewingMyAppointments(false);
    getCalendarAppointments()
      .then(data => {
        console.log('📅 Loaded all appointments:', data);
        console.log('🔍 Filtering by date:', appointmentDate);
        
        // Filter by selected date - fixed date comparison
        const filteredData = data.filter(appt => {
          if (!appt.appointmentDate) return false;
          // Extract just the date part from appointmentDate
          const apptDateOnly = appt.appointmentDate.split('T')[0];
          console.log('Comparing:', apptDateOnly, 'with', appointmentDate);
          return apptDateOnly === appointmentDate;
        });
        
        console.log('✅ Filtered appointments:', filteredData.length, 'out of', data.length);
        
        // Always show filtered results (empty list if no matches)
        setRealAppointments(filteredData);
      })
      .catch(err => {
        console.error('Failed to load appointments:', err);
        setRealAppointments([]);
      })
      .finally(() => setLoadingAppointments(false));
  }, [appointmentDate]); // FIXED: Memoized with appointmentDate dependency

  const loadMyAppointments = () => {
    const clinicId = parseInt(localStorage.getItem('clinicId') || '0');
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const userName = userData.username || '';

    if (!clinicId || !userName) {
      alert('❌ Unable to load your appointments. Please ensure you are logged in.');
      return;
    }

    setLoadingAppointments(true);
    setViewingMyAppointments(true);
    getAppointmentsByDoctorID(clinicId, userName, appointmentDate)
      .then(data => {
        console.log('👨‍⚕️ Loaded my appointments:', data);
        setRealAppointments(data);
      })
      .catch(err => {
        console.error('Failed to load my appointments:', err);
        alert('❌ Failed to load your appointments. Please try again.');
        setRealAppointments([]);
      })
      .finally(() => setLoadingAppointments(false));
  };

  const fetchAppointmentDetails = async (appt) => {
    try {
      const clinicId = appt.clinicId || parseInt(localStorage.getItem('clinicId') || '0');
      if (!clinicId) {
        console.warn('Missing clinicId, cannot load full appointment details');
        return appt;
      }

      const params = {
        clinicId: clinicId.toString(),
        firstName: appt.firstName || undefined,
        lastName: appt.lastName || undefined,
        doctorId: appt.doctorId ? appt.doctorId.toString() : undefined,
        appointmentDate: appt.appointmentDate ? appt.appointmentDate.split('T')[0] : undefined
      };

      const results = await getAppointmentsByFilters(params);
      if (Array.isArray(results) && results.length > 0) {
        const matched = results.find(item => item.appointmentId === appt.appointmentId);
        return matched || results[0];
      }
      return appt;
    } catch (error) {
      console.error('Failed to load appointment details:', error);
      return appt;
    }
  };

  // Full Edit Appointment Modal Component
  const handleInputChange = useCallback((field, value) => {
    setEditFormData(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: value
      };
    });
  }, []);

  const FullEditAppointmentModal = () => {
    if (!showEditModal || !editFormData) return null;
    
    const [localFormData, setLocalFormData] = React.useState(editFormData);
    
    React.useEffect(() => {
      if (editFormData) {
        setLocalFormData(editFormData);
      }
    }, [editFormData?.appointmentId]);
    
    const handleLocalInputChange = React.useCallback((field, value) => {
      setLocalFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }, []);
    
    const handleLocalSave = async () => {
      setEditFormData(localFormData);
      await handleUpdateAppointmentSubmit();
    };
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowEditModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden"
          >
            {/* Header - STICKY */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-6 rounded-t-3xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    ✏️
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Edit Appointment</h2>
                    <p className="text-purple-100 text-sm mt-1">
                      {editFormData.firstName} {editFormData.lastName} • ID: #{editFormData.appointmentId}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowEditModal(false)}
                  className="flex-shrink-0 w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
              
              {/* Tab Navigation */}
              <div className="flex gap-2 mt-6 overflow-x-auto">
                {[
                  { id: 'patient', label: ' Patient Info', icon: '👤' },
                  { id: 'appointment', label: ' Appointment', icon: '📅' },
                  { id: 'billing', label: ' Billing', icon: '💰' },
                  { id: 'other', label: ' Other Details', icon: '📝' }
                ].map(tab => (
                  <motion.button
                    key={tab.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveEditSection(tab.id)}
                    className={`px-6 py-2.5 rounded-xl font-semibold transition-all whitespace-nowrap ${
                      activeEditSection === tab.id
                        ? 'bg-white text-violet-700 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <span className="mr-2">{tab.icon}</span>
                    {tab.label}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Body - TABBED SECTIONS */}
            <div className="flex-1 overflow-y-auto p-8">
              <AnimatePresence mode="wait">
                {/* PATIENT INFO TAB */}
                {activeEditSection === 'patient' && (
                  <motion.div
                    key="patient"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md">
                      <h3 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                        <span>👤</span> Patient Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Patient ID (Read-Only)</label>
                          <input
                            type="text"
                            value={localFormData.patientId}
                            disabled
                            className="w-full px-4 py-3 bg-stone-100 border-2 border-stone-300 rounded-xl text-stone-600 cursor-not-allowed"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">First Name *</label>
                          <input
                            type="text"
                            value={localFormData.firstName || ""}
                            onChange={(e) => handleLocalInputChange("firstName", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Enter first name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Last Name *</label>
                          <input
                            type="text"
                            value={localFormData.lastName || ""}
                            onChange={(e) => handleLocalInputChange("lastName", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Enter last name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Phone Number</label>
                          <input
                            type="tel"
                            value={localFormData.phoneNumber || ""}
                            onChange={(e) => handleLocalInputChange("phoneNumber", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-stone-700 mb-2">Email</label>
                          <input
                            type="email"
                            value={localFormData.email || ""}
                            onChange={(e) => handleLocalInputChange("email", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                            placeholder="Enter email"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* APPOINTMENT TAB */}
                {activeEditSection === 'appointment' && (
                  <motion.div
                    key="appointment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-md">
                      <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center gap-2">
                        <span>📅</span> Scheduling Details
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Appointment Date *</label>
                          <input
                            type="date"
                            value={localFormData.appointmentDate ? localFormData.appointmentDate.split('T')[0] : ""}
                            onChange={(e) => handleLocalInputChange("appointmentDate", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Start Time *</label>
                          <input
                            type="time"
                            value={localFormData.startTime || ""}
                            onChange={(e) => handleLocalInputChange("startTime", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">End Time</label>
                          <input
                            type="time"
                            value={localFormData.endTime || ""}
                            onChange={(e) => handleLocalInputChange("endTime", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Duration (Minutes)</label>
                          <input
                            type="number"
                            value={localFormData.durationMinutes || ""}
                            onChange={(e) => handleLocalInputChange("durationMinutes", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                            placeholder="e.g., 30"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Appointment Type</label>
                          <input
                            type="text"
                            value={localFormData.appointmentType || ""}
                            onChange={(e) => handleLocalInputChange("appointmentType", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                            placeholder="e.g., Root Canal"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Status</label>
                          <select
                            value={localFormData.status || "Scheduled"}
                            onChange={(e) => handleLocalInputChange("status", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="Completed">Completed</option>
                            <option value="No-Show">No-Show</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Room Number</label>
                          <input
                            type="text"
                            value={localFormData.roomNumber || ""}
                            onChange={(e) => handleLocalInputChange("roomNumber", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                            placeholder="e.g., 101"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Attending Physician</label>
                          <input
                            type="text"
                            value={localFormData.attendingPhysician || ""}
                            onChange={(e) => handleLocalInputChange("attendingPhysician", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                            placeholder="Enter physician name"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="flex items-center gap-3 cursor-pointer bg-green-100 p-3 rounded-xl">
                            <input
                              type="checkbox"
                              checked={localFormData.isConfirmed || false}
                              onChange={(e) => handleLocalInputChange("isConfirmed", e.target.checked)}
                              className="w-5 h-5 rounded border-stone-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm font-semibold text-stone-700">✅ Confirmed Appointment</span>
                          </label>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-md">
                      <h3 className="text-xl font-bold text-purple-900 mb-4 flex items-center gap-2">
                        <span>📝</span> Visit Details
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Reason for Visit</label>
                          <textarea
                            value={localFormData.reasonForVisit || ""}
                            onChange={(e) => handleLocalInputChange("reasonForVisit", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition resize-none"
                            rows="3"
                            placeholder="Enter reason for visit"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Notes</label>
                          <textarea
                            value={localFormData.notes || ""}
                            onChange={(e) => handleLocalInputChange("notes", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition resize-none"
                            rows="3"
                            placeholder="Additional notes"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* BILLING TAB */}
                {activeEditSection === 'billing' && (
                  <motion.div
                    key="billing"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border-2 border-yellow-200 shadow-md">
                      <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center gap-2">
                        <span>💰</span> Payment Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Billable Amount (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.billableAmount || ""}
                            onChange={(e) => handleInputChange("billableAmount", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Paid Amount (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.paidAmount || ""}
                            onChange={(e) => handleInputChange("paidAmount", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Pending Amount (₹)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={editFormData.pendingAmount || ""}
                            onChange={(e) => handleInputChange("pendingAmount", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Payment Status</label>
                          <select
                            value={editFormData.paymentStatus || "Pending"}
                            onChange={(e) => handleInputChange("paymentStatus", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Paid">Paid</option>
                            <option value="Partial">Partial</option>
                            <option value="Invoice">Invoice</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* OTHER TAB */}
                {activeSection === 'other' && (
                  <motion.div
                    key="other"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border-2 border-gray-200 shadow-md">
                      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span>🔑</span> System IDs
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Doctor ID</label>
                          <input
                            type="number"
                            value={editFormData.doctorId || ""}
                            onChange={(e) => handleInputChange("doctorId", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                            placeholder="Enter doctor ID"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Clinic ID</label>
                          <input
                            type="number"
                            value={editFormData.clinicId || ""}
                            onChange={(e) => handleInputChange("clinicId", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                            placeholder="Enter clinic ID"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Enterprise ID</label>
                          <input
                            type="number"
                            value={editFormData.enterpriseId || ""}
                            onChange={(e) => handleInputChange("enterpriseId", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                            placeholder="Enter enterprise ID"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">Visit ID</label>
                          <input
                            type="number"
                            value={editFormData.visitId || ""}
                            onChange={(e) => handleInputChange("visitId", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                            placeholder="Enter visit ID"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-stone-700 mb-2">Telehealth Link</label>
                          <input
                            type="url"
                            value={editFormData.telehealthLink || ""}
                            onChange={(e) => handleInputChange("telehealthLink", e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition"
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer - STICKY */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 rounded-b-3xl border-t-2 border-stone-200 flex justify-between items-center gap-4 flex-wrap flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEditModal(false)}
                disabled={isUpdatingAppointment}
                className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg disabled:opacity-50"
              >
                ✕ Close
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLocalSave}
                disabled={isUpdatingAppointment}
                className="px-8 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-bold shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdatingAppointment ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <span>✅</span>
                    <span>Save Changes</span>
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Old Edit Appointment Modal Component (keeping for reference, can be removed later)
  const EditAppointmentModal = () => {
    if (!editModalOpen || !selectedAppointment) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={() => setEditModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  ✏️ Edit Appointment
                </h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="text-white/80 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Appointment Details */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg p-4 border border-violet-200">
                <h3 className="text-sm font-semibold text-stone-700 mb-2">Appointment Details</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium text-stone-600">Patient:</span> <span className="text-stone-800">{selectedAppointment.patient}</span></p>
                  <p><span className="font-medium text-stone-600">Type:</span> <span className="text-stone-800">{selectedAppointment.type}</span></p>
                  <p><span className="font-medium text-stone-600">Current Date:</span> <span className="text-stone-800">{selectedAppointment.date}</span></p>
                  <p><span className="font-medium text-stone-600">Current Time:</span> <span className="text-stone-800">{selectedAppointment.time}</span></p>
                  <p><span className="font-medium text-stone-600">Status:</span> 
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(selectedAppointment.status)}`}>
                      {selectedAppointment.status}
                    </span>
                  </p>
                </div>
              </div>

              {/* Action Selection */}
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-2">Select Action</label>
                <div className="space-y-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEditAction("cancel")}
                    className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-all ${
                      editAction === "cancel" 
                        ? "bg-red-50 border-red-500 text-red-700" 
                        : "bg-white border-stone-200 text-stone-700 hover:border-red-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🚫</span>
                      <div>
                        <p className="font-semibold">Cancel Appointment</p>
                        <p className="text-xs opacity-70">Mark this appointment as cancelled</p>
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setEditAction("reschedule")}
                    className={`w-full px-4 py-3 rounded-lg border-2 text-left transition-all ${
                      editAction === "reschedule" 
                        ? "bg-blue-50 border-blue-500 text-blue-700" 
                        : "bg-white border-stone-200 text-stone-700 hover:border-blue-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">📅</span>
                      <div>
                        <p className="font-semibold">Reschedule Appointment</p>
                        <p className="text-xs opacity-70">Change the date and time</p>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </div>

              {/* Reschedule Inputs - Conditional */}
              <AnimatePresence>
                {editAction === "reschedule" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1">New Date</label>
                      <input
                        type="date"
                        value={rescheduleData.date}
                        onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-1">New Time</label>
                      <input
                        type="time"
                        value={rescheduleData.time}
                        onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                        className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-6 py-4 flex justify-end gap-3 border-t border-stone-200">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 text-stone-600 hover:text-stone-800 font-semibold transition"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (editAction === "cancel") {
                    handleCancelAppointment();
                  } else if (editAction === "reschedule") {
                    handleRescheduleAppointment();
                  }
                }}
                disabled={!editAction || (editAction === "reschedule" && (!rescheduleData.date || !rescheduleData.time))}
                className={`px-6 py-2 rounded-lg font-semibold text-white transition shadow-md ${
                  !editAction || (editAction === "reschedule" && (!rescheduleData.date || !rescheduleData.time))
                    ? "bg-stone-300 cursor-not-allowed"
                    : editAction === "cancel"
                    ? "bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600"
                    : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
                }`}
              >
                {editAction === "cancel" ? "Confirm Cancel" : editAction === "reschedule" ? "Save Changes" : "Select Action"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Visit Info Modal Component - IMPROVED DIAGNOSIS FORM - FIXED FOCUS LOSS
  // Using React.memo to prevent recreation on every parent re-render (like when typing)
  const VisitInfoModal = React.memo(() => {
    if (!showVisitInfoModal || !selectedAppointmentForVisit) return null;

    const [visitForm, setVisitForm] = useState({
      visitDate: new Date().toISOString().split('T')[0],
      chiefComplaint: '',
      diagnosis: '',
      treatmentProvided: '',
      prescriptions: '',
      followUpDate: '',
      notes: ''
    });
    const [savingVisit, setSavingVisit] = useState(false);
    const [isExistingVisit, setIsExistingVisit] = useState(false);
    
    // LOCAL prescription state - moved from parent to prevent page refresh on keystroke
    const [localCurrentMedication, setLocalCurrentMedication] = useState({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: ''
    });
    const [localInlineMedications, setLocalInlineMedications] = useState([]);
    const [localEditingMedicationIndex, setLocalEditingMedicationIndex] = useState(null);
    const [localMedicineDropdownOpen, setLocalMedicineDropdownOpen] = useState(false);
    const localMedicineInputRef = useRef(null);
    
    // Destructure to use simpler names in JSX (prevents massive refactoring)
    const currentMedication = localCurrentMedication;
    const setCurrentMedication = setLocalCurrentMedication;
    const inlineMedications = localInlineMedications;
    const setInlineMedications = setLocalInlineMedications;
    const editingMedicationIndex = localEditingMedicationIndex;
    const setEditingMedicationIndex = setLocalEditingMedicationIndex;
    const medicineDropdownOpen = localMedicineDropdownOpen;
    const setMedicineDropdownOpen = setLocalMedicineDropdownOpen;
    const medicineInputRef = localMedicineInputRef;

    // Load existing visit data if available
    useEffect(() => {
      if (selectedAppointmentForVisit?.existingVisitData) {
        const existingData = selectedAppointmentForVisit.existingVisitData;
        console.log('📥 Loading existing visit data into form:', existingData);
        console.log('📋 Available fields in response:');
        console.log('   - visitDate:', existingData.visitDate);
        console.log('   - chiefComplaint:', existingData.chiefComplaint);
        console.log('   - diagnosis:', existingData.diagnosis);
        console.log('   - treatmentProvided:', existingData.treatmentProvided);
        console.log('   - reasonForVisit:', existingData.reasonForVisit);
        console.log('   - diagnoses:', existingData.diagnoses);
        console.log('   - treatments:', existingData.treatments);
        console.log('   - followUpDate:', existingData.followUpDate);
        console.log('   - notes:', existingData.notes);
        console.log('   - prescriptions:', existingData.prescriptions);
        
        // Check if this is an existing visit (has visitDate data)
        const hasExistingData = existingData.visitDate || existingData.diagnosis || existingData.reasonForVisit;
        if (hasExistingData) {
          setIsExistingVisit(true);
          console.log('✅ Existing visit detected - will use UPDATE API');
        }
        
        // Load visit form data - handle both old and new field names
        setVisitForm({
          visitDate: existingData.visitDate ? existingData.visitDate.split('T')[0] : new Date().toISOString().split('T')[0],
          chiefComplaint: existingData.chiefComplaint || existingData.reasonForVisit || '',
          diagnosis: existingData.diagnosis || existingData.diagnoses || '',
          treatmentProvided: existingData.treatmentProvided || existingData.treatments || '',
          prescriptions: existingData.prescriptions || '',
          followUpDate: existingData.followUpDate ? existingData.followUpDate.split('T')[0] : '',
          notes: existingData.notes || ''
        });
        
        console.log('✅ Form data loaded:');
        console.log('   - Chief Complaint:', existingData.chiefComplaint || existingData.reasonForVisit);
        console.log('   - Diagnosis:', existingData.diagnosis || existingData.diagnoses);
        console.log('   - Treatment Provided:', existingData.treatmentProvided || existingData.treatments);
        
        // Load medications if they exist
        if (existingData.prescriptions && Array.isArray(existingData.prescriptions)) {
          console.log('💊 Loading existing medications:', existingData.prescriptions);
          setLocalInlineMedications(existingData.prescriptions.map(med => ({
            name: med.medicineName || med.name || '',
            dosage: med.dosage || '',
            frequency: med.frequency || '',
            duration: med.duration || '',
            instructions: med.instructions || ''
          })));
        }
      } else {
        console.log('📝 No existing data, initializing empty form');
        setIsExistingVisit(false);
      }
    }, [selectedAppointmentForVisit]);
    
    // Sample medical conditions - in real app this would come from API
    const chronicDiseases = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Kidney Disease'];
    const allergies = ['Penicillin', 'Aspirin', 'Iodine'];

    // Manage body overflow when modal opens/closes
    useEffect(() => {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (medicineInputRef.current && !medicineInputRef.current.contains(event.target)) {
          setMedicineDropdownOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Local medication handlers
    const handleAddMedication = useCallback(() => {
      console.log('➕ Adding medication:', currentMedication);
      if (!currentMedication.name || !currentMedication.dosage || !currentMedication.frequency || !currentMedication.duration) {
        alert('❌ Please fill in all required fields (Name, Dosage, Frequency, Duration)');
        return;
      }

      if (editingMedicationIndex !== null) {
        const updated = [...inlineMedications];
        updated[editingMedicationIndex] = { ...currentMedication };
        setInlineMedications(updated);
        setEditingMedicationIndex(null);
      } else {
        setInlineMedications([...inlineMedications, { ...currentMedication }]);
      }

      setCurrentMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
    }, [currentMedication, editingMedicationIndex, inlineMedications]);

    const handleEditMedication = (index) => {
      setCurrentMedication({ ...inlineMedications[index] });
      setEditingMedicationIndex(index);
    };

    const handleDeleteMedication = (index) => {
      setInlineMedications(inlineMedications.filter((_, i) => i !== index));
    };

    const handleCancelEdit = () => {
      setCurrentMedication({ name: '', dosage: '', frequency: '', duration: '', instructions: '' });
      setEditingMedicationIndex(null);
    };

    // Print prescription handler
    const handlePrintPrescription = () => {
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      const appointmentDetails = selectedAppointmentForVisit;
      setPrintPrescriptionData({
        patientName: `${appointmentDetails.firstName} ${appointmentDetails.lastName}`,
        patientId: appointmentDetails.patientId,
        patientAge: appointmentDetails.age || 'N/A',
        doctorName: appointmentDetails.doctorName || userData.username || 'Doctor',
        registrationNumber: appointmentDetails.registrationNumber || 'N/A',
        diagnosis: visitForm.diagnosis,
        medications: inlineMedications,
        notes: visitForm.notes
      });
    };

    // Memoized input handler to prevent focus loss
    const handleVisitFormChange = useCallback((field, value) => {
      setVisitForm(prev => ({
        ...prev,
        [field]: value
      }));
    }, []);

    const handleSaveVisit = async () => {
      console.log('═════════════════════════════════════════════');
      console.log('🚀 SAVE VISIT INITIATED');
      console.log('═════════════════════════════════════════════');
      
      if (!visitForm.chiefComplaint || !visitForm.diagnosis || !visitForm.treatmentProvided) {
        alert('❌ Please fill in Chief Complaint, Diagnosis, and Treatment Provided fields.');
        return;
      }

      setSavingVisit(true);
      try {
        // Log localStorage contents
        console.log('📦 Checking localStorage...');
        console.log('   localStorage keys:', Object.keys(localStorage));
        console.log('   selectedAccess raw:', localStorage.getItem("selectedAccess"));
        console.log('   userData raw:', localStorage.getItem("userData"));
        
        const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const appointmentDetails = selectedAppointmentForVisit;
        
        console.log('✅ Parsed selectedAccess:', selectedAccess);
        console.log('   - enterpriseId:', selectedAccess?.enterpriseId);
        console.log('   - clinicId:', selectedAccess?.clinicId);
        console.log('   - Type of enterpriseId:', typeof selectedAccess?.enterpriseId);
        console.log('   - Type of clinicId:', typeof selectedAccess?.clinicId);
        console.log('✅ Parsed userData:', userData);
        
        // Validate selectedAccess exists
        if (!selectedAccess || !selectedAccess.enterpriseId || !selectedAccess.clinicId) {
          console.error('❌ ==================== VALIDATION FAILED ====================');
          console.error('❌ selectedAccess is invalid!');
          console.error('   selectedAccess object:', selectedAccess);
          console.error('   enterpriseId:', selectedAccess?.enterpriseId);
          console.error('   clinicId:', selectedAccess?.clinicId);
          console.error('❌ ============================================================');
          alert('❌ Session error: Please logout and login again to select your enterprise/clinic.');
          setSavingVisit(false);
          return;
        }
        
        console.log('✅ Validation passed - selectedAccess is valid');
        
        console.log('💊 ═══════════════════════════════════════════');
        console.log('💊 Checking inlineMedications before conversion');
        console.log('💊 Count:', inlineMedications.length);
        console.log('💊 Data:', JSON.stringify(inlineMedications, null, 2));
        console.log('💊 ═══════════════════════════════════════════');

        // Convert inline medications to Prescription model format (C# PascalCase)
        const prescriptions = inlineMedications.map(med => ({
          MedicineName: med.name,
          Dosage: med.dosage,
          Frequency: med.frequency,
          Duration: med.duration,
          SpecialInstructions: med.instructions || '',
          GeneralPrescriptionNotes: ''
        }));
        
        console.log('💊 ═══════════════════════════════════════════');
        console.log('💊 Converted prescriptions:');
        console.log('💊 Count:', prescriptions.length);
        console.log('💊 Data:', JSON.stringify(prescriptions, null, 2));
        console.log('💊 ═══════════════════════════════════════════');

        // Build PatientVisitInformation payload (C# PascalCase)
        const visitData = {
          AppointmentId: parseInt(appointmentDetails.appointmentId || 0),
          PatientId: parseInt(appointmentDetails.patientId || 0),
          ClinicId: parseInt(selectedAccess.clinicId || appointmentDetails.clinicId || 0),
          VisitDate: visitForm.visitDate,
          ReasonForVisit: visitForm.chiefComplaint,
          Diagnoses: visitForm.diagnosis,
          Treatments: visitForm.treatmentProvided,
          Notes: visitForm.notes || '',
          NextAppointmentDate: visitForm.followUpDate || null,
          AttendingPhysician: appointmentDetails.doctorName || userData.username || 'Doctor',
          BillingAmount: Number(appointmentDetails.billableAmount) || 0,
          PaymentStatus: appointmentDetails.paymentStatus || 'Pending',
          CreatedBy: userData.username || userData.fullName || 'Doctor',
          UpdatedBy: userData.username || userData.fullName || 'Doctor',
          Prescriptions: prescriptions
        };

        console.log('═══════════════════════════════════════════════════════');
        console.log('📤 PATIENT VISIT PAYLOAD CONSTRUCTED');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📦 Full Payload:', JSON.stringify(visitData, null, 2));
        console.log('📊 Payload Fields:');
        console.log('   - AppointmentId:', visitData.AppointmentId, '(type:', typeof visitData.AppointmentId, ')');
        console.log('   - PatientId:', visitData.PatientId, '(type:', typeof visitData.PatientId, ')');
        console.log('   - ClinicId:', visitData.ClinicId, '(type:', typeof visitData.ClinicId, ')');
        console.log('   - VisitDate:', visitData.VisitDate);
        console.log('   - ReasonForVisit:', visitData.ReasonForVisit);
        console.log('   - Diagnoses:', visitData.Diagnoses);
        console.log('   - Treatments:', visitData.Treatments);
        console.log('   - Prescriptions count:', visitData.Prescriptions?.length || 0);
        console.log('═══════════════════════════════════════════════════════');
        
        // Call appropriate API based on whether it's a new or existing visit
        let response;
        if (isExistingVisit) {
          console.log('🔄 UPDATING EXISTING VISIT - Calling EditPatientVisit API');
          response = await editPatientVisit(visitData);
        } else {
          console.log('✨ CREATING NEW VISIT - Calling AddPatientVisit API');
          response = await addPatientVisit(visitData);
        }
        
        // Show success modal with funny message
        const funnyMessages = [
          "🎉 " + (isExistingVisit ? 'Diagnosis updated!' : 'Diagnosis saved!') + " Another satisfied patient incoming!",
          "💊 Boom! Visit documented with surgical precision!",
          "✅ Perfect! Your diagnosis is now immortalized in the system!",
          "🏥 Success! You've just made medical history!",
          "📋 Done! Your visit report is safe and sound!",
          "💉 Nailed it! The prescription gods smile upon you!",
          "🎯 Visit " + (isExistingVisit ? 'updated' : 'saved') + "! You're officially awesome today!",
          "🚀 Warp speed success! Your diagnosis has entered orbit!",
          "🏆 Champion! Your patient care game is strong!",
          "⭐ Star quality diagnosis! Standing ovation from the germs!"
        ];
        
        const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
        setDiagnosisSaveMessage(randomMessage);
        setShowDiagnosisSaveSuccess(true);
        
        console.log('✅ Visit ' + (isExistingVisit ? 'updated' : 'saved') + ' successfully:', response);
        
        // Reset form
        setTimeout(() => {
          setShowVisitInfoModal(false);
          setShowDiagnosisSaveSuccess(false);
          setInlineMedications([]);
          setVisitForm({
            visitDate: new Date().toISOString().split('T')[0],
            followUpDate: '',
            chiefComplaint: '',
            diagnosis: '',
            treatmentProvided: '',
            notes: '',
            prescriptions: ''
          });
        }, 3000);
      } catch (error) {
        console.error('Failed to save visit:', error);
        alert('❌ Failed to save visit information. Please try again.');
      } finally {
        setSavingVisit(false);
      }
    };

    // Listen for prescription saved from prescription modal
    // Prescription is tracked at the top level now to avoid focus resets and cross-modal state issues
    
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowVisitInfoModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col"
          >
            {/* Header - Sticky */}
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 px-8 py-6 rounded-t-3xl flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-lg">
                  🩺
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Diagnosis & Patient Visit</h2>
                  <p className="text-teal-100 text-sm mt-1">
                    {selectedAppointmentForVisit.firstName} {selectedAppointmentForVisit.lastName} • ID: #{selectedAppointmentForVisit.patientId}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowVisitInfoModal(false)}
                className="flex-shrink-0 w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Body - Scrollable with 2-column layout */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COLUMN - MEDICAL HISTORY */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-1 space-y-4"
                >
                  {/* Patient Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md h-fit">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <span>👤</span> Patient Info
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3 pb-3 border-b border-blue-100">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                          {selectedAppointmentForVisit.firstName?.charAt(0)}{selectedAppointmentForVisit.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs text-stone-600 font-medium">Name</p>
                          <p className="font-bold text-stone-800">{selectedAppointmentForVisit.firstName} {selectedAppointmentForVisit.lastName}</p>
                        </div>
                      </div>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-stone-600">Phone:</span>
                          <span className="font-bold text-stone-800">{selectedAppointmentForVisit.phoneNumber || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-600">Email:</span>
                          <span className="font-bold text-stone-800 truncate max-w-[140px]">{selectedAppointmentForVisit.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Chronic Diseases */}
                  <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl p-6 border-2 border-red-200 shadow-md h-fit">
                    <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                      <span>⚠️</span> Chronic Diseases
                    </h3>
                    <div className="space-y-2">
                      {chronicDiseases.map((disease, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white rounded-lg p-3 border-l-4 border-red-400 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-stone-800">✓ {disease}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Allergies */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-md h-fit">
                    <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                      <span>🚨</span> Allergies
                    </h3>
                    <div className="space-y-2">
                      {allergies.map((allergy, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="bg-white rounded-lg p-3 border-l-4 border-orange-400 shadow-sm"
                        >
                          <p className="text-sm font-semibold text-stone-800">⚠️ {allergy}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  {/* Appointment Summary */}
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl p-6 border-2 border-violet-200 shadow-md h-fit">
                    <h3 className="text-lg font-bold text-violet-900 mb-4 flex items-center gap-2">
                      <span>📅</span> Appointment
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between pb-2 border-b border-violet-100">
                        <span className="text-stone-600">Date:</span>
                        <span className="font-bold text-stone-800">{new Date(selectedAppointmentForVisit.appointmentDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">Time:</span>
                        <span className="font-bold text-stone-800">{selectedAppointmentForVisit.startTime || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-violet-100">
                        <span className="text-stone-600">Type:</span>
                        <span className="font-bold text-stone-800">{selectedAppointmentForVisit.appointmentType || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* CENTER & RIGHT COLUMN - VISIT FORM */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="lg:col-span-2 space-y-5"
                >
                  {/* Visit Dates */}
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-6 border-2 border-yellow-200 shadow-md">
                    <h3 className="text-lg font-bold text-yellow-900 mb-4 flex items-center gap-2">
                      <span>📆</span> Visit Timeline
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Visit Date <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          value={visitForm.visitDate}
                          onChange={(e) => handleVisitFormChange('visitDate', e.target.value)}
                          className="w-full px-4 py-2 border-2 border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-stone-700 mb-2">Follow-up Date</label>
                        <input
                          type="date"
                          value={visitForm.followUpDate}
                          onChange={(e) => handleVisitFormChange('followUpDate', e.target.value)}
                          className="w-full px-4 py-2 border-2 border-yellow-300 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chief Complaint */}
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl p-6 border-2 border-pink-200 shadow-md">
                    <h3 className="text-lg font-bold text-pink-900 mb-4 flex items-center gap-2">
                      <span>🤕</span> Chief Complaint <span className="text-red-500">*</span>
                    </h3>
                    <textarea
                      key="chiefComplaint"
                      value={visitForm.chiefComplaint}
                      onChange={(e) => handleVisitFormChange('chiefComplaint', e.target.value)}
                      placeholder="What is the main reason for the visit?"
                      rows={2}
                      className="w-full px-4 py-2 border-2 border-pink-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition resize-none"
                    />
                  </div>

                  {/* Diagnosis - PROMINENT */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-300 shadow-lg ring-2 ring-green-200">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                        <span>🔬</span> Diagnosis <span className="text-red-500">*</span>
                      </h3>
                      <div className="flex gap-2">
                        {prescriptionId && (
                          <motion.button
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={async () => {
                              try {
                                console.log('📋 Fetching prescription with ID:', prescriptionId);
                                const prescription = await getPrescriptionById(prescriptionId);
                                console.log('✅ Prescription fetched:', prescription);
                                setViewedPrescription(prescription);
                                setShowViewPrescriptionModal(true);
                              } catch (error) {
                                console.error('Failed to fetch prescription:', error);
                                alert('❌ Failed to load prescription. Please try again.');
                              }
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2 text-sm"
                          >
                            <span>👁️</span>
                            <span>View Prescription</span>
                          </motion.button>
                        )}
                      </div>
                    </div>
                    <textarea
                      value={visitForm.diagnosis}
                      onChange={(e) => handleVisitFormChange('diagnosis', e.target.value)}
                      placeholder="Enter detailed diagnosis based on examination and findings..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition resize-none font-medium text-stone-800"
                    />
                  </div>

                  {/* Inline Prescription Section */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border-2 border-purple-300 shadow-lg">
                    <h3 className="text-lg font-bold text-purple-900 mb-4 flex items-center gap-2">
                      <span>💊</span> Write Prescription
                    </h3>

                    {/* Medication Input Form - INLINE for better state management */}
                    <div className="bg-white rounded-xl p-5 mb-5 border-2 border-purple-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        {/* Medicine Name Searchable Dropdown */}
                        <div className="md:col-span-2" ref={medicineInputRef}>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Medicine Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              key="medicine-name-input"
                              type="text"
                              value={currentMedication.name || ""}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                const currentDOMValue = e.target.value;
                                console.log('🔵 MEDICINE NAME TYPING:', newValue);
                                console.log('🔵 DOM Input value:', currentDOMValue);
                                console.log('🔵 DOM Input selectionStart:', e.target.selectionStart);
                                console.log('🔵 DOM Input selectionEnd:', e.target.selectionEnd);
                                console.log('🔵 Current state BEFORE - name:', currentMedication.name, '| Full object:', JSON.stringify(currentMedication));
                                setCurrentMedication(prev => {
                                  const updated = { ...prev, name: newValue };
                                  console.log('🔵 Current state AFTER - name:', updated.name, '| Full object:', JSON.stringify(updated));
                                  return updated;
                                });
                                if (!medicineDropdownOpen) {
                                  console.log('🔵 Opening dropdown');
                                  setMedicineDropdownOpen(true);
                                }
                              }}
                              onFocus={() => {
                                if (inventoryMeds.length === 0 && !loadingMeds) {
                                  loadInventoryMedications();
                                }
                                setLocalMedicineDropdownOpen(true);
                              }}
                              placeholder="Search or type medication name..."
                              className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                              autoComplete="off"
                            />
                            {currentMedication.name && !medicineDropdownOpen && (
                              <div className="mt-1 px-3 py-2 bg-green-50 border border-green-300 rounded-lg text-sm">
                                <span className="text-green-700">✓ Selected:</span> <span className="font-bold text-stone-900">{currentMedication.name}</span>
                              </div>
                            )}
                            
                            {/* Dropdown Panel */}
                            {medicineDropdownOpen && (
                              <div className="absolute z-30 mt-1 w-full bg-white border-2 border-purple-200 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                                {loadingMeds ? (
                                  <div className="px-3 py-8 text-center">
                                    <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                    <p className="text-sm text-stone-600 font-medium">Loading medicines...</p>
                                  </div>
                                ) : inventoryMeds.length === 0 ? (
                                  <div className="px-4 py-6 text-center">
                                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                      <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                      </svg>
                                    </div>
                                    <p className="text-sm text-stone-600 mb-4">No medicines in inventory. Add one to get started!</p>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        console.log('🟡 Opening add medicine modal');
                                        handleOpenAddMedicineModal(currentMedication.name);
                                        setMedicineDropdownOpen(false);
                                      }}
                                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all inline-flex items-center gap-2"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                      </svg>
                                      Add to Inventory
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    {inventoryMeds
                                      .filter(med => {
                                        const searchVal = (currentMedication.name || "").toLowerCase();
                                        return !searchVal || med.itemName?.toLowerCase().includes(searchVal) || med.itemCode?.toLowerCase().includes(searchVal);
                                      })
                                      .map((m) => (
                                      <button
                                        type="button"
                                        key={m.itemId || m.id}
                                        onClick={() => {
                                          console.log('✅ Medicine SELECTED:', m.itemName);
                                          console.log('✅ Medicine object:', m);
                                          setCurrentMedication(prev => {
                                            const updated = { ...prev, name: m.itemName };
                                            console.log('✅ Updated medication state:', updated);
                                            return updated;
                                          });
                                          setMedicineDropdownOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 hover:bg-purple-50 transition border-b border-purple-50 last:border-b-0 focus:outline-none focus:bg-purple-100"
                                      >
                                        <div className="font-semibold text-stone-800">{m.itemName}{m.itemCode ? ` (${m.itemCode})` : ""}</div>
                                        <div className="text-xs text-stone-500 flex gap-3 flex-wrap">
                                          {m.category && <span>Category: {m.category}</span>}
                                          {m.unit && <span>Unit: {m.unit}</span>}
                                        </div>
                                      </button>
                                    ))}
                                    <div className="sticky bottom-0 bg-gradient-to-r from-purple-50 to-indigo-50 p-3 border-t border-purple-200">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          console.log('🟡 Opening add medicine modal from dropdown');
                                          handleOpenAddMedicineModal(currentMedication.name);
                                          setMedicineDropdownOpen(false);
                                        }}
                                        className="w-full px-4 py-2 bg-white border-2 border-purple-300 text-purple-700 rounded-lg font-semibold hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Add New Medicine
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dosage */}
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">
                            Dosage <span className="text-red-500">*</span>
                          </label>
                          <input
                            key="dosage-input"
                            type="text"
                            value={currentMedication.dosage || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              console.log('🟠 DOSAGE TYPING:', newValue);
                              console.log('🟠 DOM dosage value:', e.target.value);
                              console.log('🟠 Current dosage BEFORE:', currentMedication.dosage);
                              setCurrentMedication(prev => {
                                const updated = { ...prev, dosage: newValue };
                                console.log('🟠 Dosage updated to:', updated.dosage);
                                return updated;
                              });
                            }}
                            placeholder="e.g., 500mg, 1 tablet"
                            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                            autoComplete="off"
                          />
                        </div>

                        {/* Frequency */}
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">
                            Frequency <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={currentMedication.frequency || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              console.log('🟡 FREQUENCY SELECTED:', newValue);
                              setCurrentMedication(prev => {
                                const updated = { ...prev, frequency: newValue };
                                console.log('🟡 Frequency updated:', updated);
                                return updated;
                              });
                            }}
                            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                          >
                            <option value="">Select frequency...</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="Every 4 hours">Every 4 hours</option>
                            <option value="Every 6 hours">Every 6 hours</option>
                            <option value="Every 8 hours">Every 8 hours</option>
                            <option value="Every 12 hours">Every 12 hours</option>
                            <option value="Before meals">Before meals</option>
                            <option value="After meals">After meals</option>
                            <option value="At bedtime">At bedtime</option>
                            <option value="As needed">As needed</option>
                          </select>
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="block text-sm font-bold text-stone-700 mb-2">
                            Duration <span className="text-red-500">*</span>
                          </label>
                          <input
                            key="duration-input"
                            type="text"
                            value={currentMedication.duration || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              console.log('🟣 DURATION TYPING:', newValue);
                              setCurrentMedication(prev => {
                                const updated = { ...prev, duration: newValue };
                                console.log('🟣 Duration updated:', updated);
                                return updated;
                              });
                            }}
                            placeholder="e.g., 7 days, 2 weeks"
                            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                            autoComplete="off"
                          />
                        </div>

                        {/* Instructions */}
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-stone-700 mb-2">
                            Special Instructions
                          </label>
                          <input
                            key="instructions-input"
                            type="text"
                            value={currentMedication.instructions || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              console.log('🔵 INSTRUCTIONS TYPING:', newValue);
                              setCurrentMedication(prev => {
                                const updated = { ...prev, instructions: newValue };
                                console.log('🔵 Instructions updated:', updated);
                                return updated;
                              });
                            }}
                            placeholder="e.g., Take with food, Avoid alcohol"
                            className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      {/* Add/Update Button */}
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            console.log('➕ ADD MEDICATION CLICKED');
                            console.log('➕ Current medication:', currentMedication);
                            handleAddMedication();
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
                        >
                          <span>{editingMedicationIndex !== null ? '✏️' : '➕'}</span>
                          <span>{editingMedicationIndex !== null ? 'Update Medication' : 'Add Medication'}</span>
                        </motion.button>
                        {editingMedicationIndex !== null && (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              console.log('❌ CANCEL EDIT CLICKED');
                              handleCancelEdit();
                            }}
                            className="px-6 py-2 bg-gray-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition"
                          >
                            Cancel
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {/* Medications List Grid */}
                    {inlineMedications.length > 0 && (
                      <div className="space-y-3 mb-5">
                        <h4 className="font-bold text-purple-900 flex items-center gap-2">
                          <span>📋</span> Added Medications ({inlineMedications.length})
                        </h4>
                        <div className="grid grid-cols-1 gap-3">
                          {inlineMedications.map((med, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-md hover:shadow-lg transition"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h5 className="font-bold text-stone-800 text-lg mb-2">{med.name}</h5>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <div>
                                      <span className="font-semibold text-stone-600">Dosage:</span>
                                      <p className="text-stone-800">{med.dosage}</p>
                                    </div>
                                    <div>
                                      <span className="font-semibold text-stone-600">Frequency:</span>
                                      <p className="text-stone-800">{med.frequency}</p>
                                    </div>
                                    <div>
                                      <span className="font-semibold text-stone-600">Duration:</span>
                                      <p className="text-stone-800">{med.duration}</p>
                                    </div>
                                    {med.instructions && (
                                      <div className="md:col-span-1">
                                        <span className="font-semibold text-stone-600">Instructions:</span>
                                        <p className="text-stone-800">{med.instructions}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleEditMedication(index)}
                                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                                    title="Edit"
                                  >
                                    ✏️
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleRemoveMedication(index)}
                                    className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"
                                    title="Remove"
                                  >
                                    🗑️
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setShowPrescriptionPreview(true)}
                            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-2"
                          >
                            <span>🖨️</span>
                            <span>Preview & Print</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSaveAllPrescriptions}
                            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-2"
                          >
                            <span>💾</span>
                            <span>Save All Prescriptions</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePrintPrescription}
                            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-2"
                          >
                            <span>🖨️</span>
                            <span>Print Prescription</span>
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              const appointmentDetails = selectedAppointmentForVisit;
                              const medicationText = inlineMedications
                                .map(med => `${med.name} - ${med.dosage} ${med.frequency} for ${med.duration}`)
                                .join('\n');
                              const mailtoLink = `mailto:${appointmentDetails.patientEmail || ''}?subject=Your Prescription&body=Dear Patient,\n\nHere is your prescription:\n\n${medicationText}\n\nPlease follow the instructions carefully.\n\nBest regards,\nYour Doctor`;
                              window.location.href = mailtoLink;
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-2"
                          >
                            <span>📧</span>
                            <span>Send via Email</span>
                          </motion.button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Treatment Provided */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <span>⚕️</span> Treatment Provided <span className="text-red-500">*</span>
                    </h3>
                    <textarea
                      value={visitForm.treatmentProvided}
                      onChange={(e) => handleVisitFormChange('treatmentProvided', e.target.value)}
                      placeholder="Describe the treatment provided during this visit..."
                      rows={3}
                      className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition resize-none"
                    />
                  </div>

                  {/* Prescriptions & Notes */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                          <span>💊</span> Added Medications
                          {inlineMedications && inlineMedications.length > 0 && (
                            <span className="ml-2 px-3 py-1 bg-indigo-600 text-white rounded-full text-xs font-bold">
                              {inlineMedications.length}
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                        {inlineMedications && inlineMedications.length > 0 ? (
                          inlineMedications.map((med, idx) => (
                            <motion.div 
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="bg-white rounded-xl p-4 border-l-4 border-indigo-500 shadow-sm hover:shadow-md transition-shadow group"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-bold text-indigo-900 text-sm">{idx + 1}. {med.name}</p>
                                  <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                                    <div className="bg-blue-50 p-2 rounded">
                                      <p className="text-gray-600 font-semibold">Dosage</p>
                                      <p className="text-indigo-700 font-bold">{med.dosage || '-'}</p>
                                    </div>
                                    <div className="bg-green-50 p-2 rounded">
                                      <p className="text-gray-600 font-semibold">Frequency</p>
                                      <p className="text-green-700 font-bold">{med.frequency || '-'}</p>
                                    </div>
                                    <div className="bg-purple-50 p-2 rounded">
                                      <p className="text-gray-600 font-semibold">Duration</p>
                                      <p className="text-purple-700 font-bold">{med.duration || '-'}</p>
                                    </div>
                                  </div>
                                  {med.instructions && (
                                    <p className="text-xs text-gray-600 italic mt-2 bg-yellow-50 p-2 rounded">
                                      📋 {med.instructions}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                      setCurrentMedication(med);
                                      setEditingMedicationIndex(idx);
                                    }}
                                    className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition text-sm"
                                    title="Edit"
                                  >
                                    ✏️
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDeleteMedication(idx)}
                                    className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition text-sm"
                                    title="Delete"
                                  >
                                    🗑️
                                  </motion.button>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-indigo-500 text-sm">📭 No medications added yet</p>
                            <p className="text-gray-400 text-xs mt-1">Add medications from the form above</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span>📝</span> Additional Notes
                      </h3>
                      <textarea
                        value={visitForm.notes}
                        onChange={(e) => handleVisitFormChange('notes', e.target.value)}
                        placeholder="Any additional observations or follow-up instructions..."
                        rows={3}
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition resize-none text-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Footer - Sticky */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 rounded-b-3xl border-t-2 border-stone-200 flex justify-between items-center gap-4 flex-wrap flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowVisitInfoModal(false)}
                className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg"
              >
                ✕ Close
              </motion.button>
              <div className="flex gap-3">
                {currentPrescription && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowViewPrescriptionModal(true)}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <span>👁️</span>
                      <span>View Prescription</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowPrintPreviewModal(true)}
                      className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <span>🖨️</span>
                      <span>Print Prescription</span>
                    </motion.button>
                  </>
                )}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveVisit}
                  disabled={savingVisit || !visitForm.chiefComplaint || !visitForm.diagnosis || !visitForm.treatmentProvided}
                  className={`px-8 py-2.5 rounded-lg font-bold text-white transition shadow-lg flex items-center gap-2 ${
                    savingVisit || !visitForm.chiefComplaint || !visitForm.diagnosis || !visitForm.treatmentProvided
                      ? 'bg-gray-300 cursor-not-allowed'
                      : isExistingVisit
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700'
                  }`}
                >
                  <span>{isExistingVisit ? '🔄' : '💾'}</span>
                  <span>{savingVisit ? 'Processing...' : isExistingVisit ? 'Update Visit & Diagnosis' : 'Save Visit & Diagnosis'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  });

  // Appointment Details Modal Component - IMPROVED LAYOUT
  const AppointmentDetailsModal = () => {
    if (!showAppointmentDetails || !selectedAppointmentDetails) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
          onClick={() => setShowAppointmentDetails(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col"
          >
            {/* Header - STICKY */}
            <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-6 rounded-t-3xl flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                  📋
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Appointment Details</h2>
                  <p className="text-purple-100 text-sm mt-1">
                    {selectedAppointmentDetails.firstName} {selectedAppointmentDetails.lastName}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAppointmentDetails(false)}
                className="flex-shrink-0 w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Body - SCROLLABLE WITH 2-COLUMN GRID */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Information Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md h-fit"
                >
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">👤</span> Patient Info
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 pb-3 border-b border-blue-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                        {selectedAppointmentDetails.firstName?.charAt(0)}{selectedAppointmentDetails.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-stone-600 font-medium">Full Name</p>
                        <p className="font-bold text-stone-800">{selectedAppointmentDetails.firstName} {selectedAppointmentDetails.lastName}</p>
                      </div>
                    </div>
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-medium">Patient ID:</span>
                        <span className="font-bold text-stone-800">#{selectedAppointmentDetails.patientId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-medium">Phone:</span>
                        <span className="font-bold text-stone-800">{selectedAppointmentDetails.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-medium">Email:</span>
                        <span className="font-bold text-stone-800 text-xs truncate">{selectedAppointmentDetails.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-blue-100">
                        <span className="text-stone-600 font-medium">Doctor ID:</span>
                        <span className="font-bold text-stone-800">#{selectedAppointmentDetails.doctorId ?? 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-medium">Clinic ID:</span>
                        <span className="font-bold text-stone-800">#{selectedAppointmentDetails.clinicId ?? 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Appointment Information Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-violet-200 shadow-md h-fit"
                >
                  <h3 className="text-lg font-bold text-violet-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📅</span> Appointment
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between pb-2 border-b border-violet-100">
                      <span className="text-stone-600 font-medium">Date:</span>
                      <span className="font-bold text-stone-800">
                        {selectedAppointmentDetails.appointmentDate 
                          ? new Date(selectedAppointmentDetails.appointmentDate).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600 font-medium">Time:</span>
                      <span className="font-bold text-stone-800">
                        {selectedAppointmentDetails.startTime || 'N/A'}
                        {selectedAppointmentDetails.endTime ? ` - ${selectedAppointmentDetails.endTime}` : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600 font-medium">Duration:</span>
                      <span className="font-bold text-stone-800">{selectedAppointmentDetails.durationMinutes ?? 'N/A'} min</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-violet-100">
                      <span className="text-stone-600 font-medium">Type:</span>
                      <span className="font-bold text-stone-800">{selectedAppointmentDetails.appointmentType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600 font-medium">Room:</span>
                      <span className="font-bold text-stone-800">{selectedAppointmentDetails.roomNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-violet-100">
                      <span className="text-stone-600 font-medium">Status:</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(selectedAppointmentDetails.status || 'Scheduled')}`}>
                        {selectedAppointmentDetails.status || 'Scheduled'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Billing & Payment Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-md h-fit"
                >
                  <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">💳</span> Billing
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between pb-2 border-b border-emerald-100">
                      <span className="text-stone-600 font-medium">Billable:</span>
                      <span className="font-bold text-stone-800">₹{selectedAppointmentDetails.billableAmount ?? '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600 font-medium">Paid:</span>
                      <span className="font-bold text-green-700">₹{selectedAppointmentDetails.paidAmount ?? '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600 font-medium">Pending:</span>
                      <span className="font-bold text-amber-700">₹{selectedAppointmentDetails.pendingAmount ?? '0'}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-emerald-100">
                      <span className="text-stone-600 font-medium">Status:</span>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${getStatusColor(selectedAppointmentDetails.paymentStatus || 'Pending')}`}>
                        {selectedAppointmentDetails.paymentStatus || 'Pending'}
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Additional Info Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-gradient-to-br from-slate-50 via-stone-50 to-gray-50 rounded-2xl p-6 border-2 border-stone-200 shadow-md h-fit"
                >
                  <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center gap-2">
                    <span className="text-2xl">ℹ️</span> Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    {selectedAppointmentDetails.attendingPhysician && (
                      <div className="flex justify-between pb-2 border-b border-stone-100">
                        <span className="text-stone-600 font-medium">Physician:</span>
                        <span className="font-bold text-stone-800">{selectedAppointmentDetails.attendingPhysician}</span>
                      </div>
                    )}
                    {selectedAppointmentDetails.reasonForVisit && (
                      <div className="pb-2 border-b border-stone-100">
                        <span className="text-stone-600 font-medium text-xs">Reason:</span>
                        <p className="font-bold text-stone-800 text-xs">{selectedAppointmentDetails.reasonForVisit}</p>
                      </div>
                    )}
                    {selectedAppointmentDetails.notes && (
                      <div className="pb-2 border-b border-stone-100">
                        <span className="text-stone-600 font-medium text-xs">Notes:</span>
                        <p className="font-bold text-stone-800 text-xs line-clamp-2">{selectedAppointmentDetails.notes}</p>
                      </div>
                    )}
                    <div className="flex justify-between pt-2">
                      <span className="text-stone-600 font-medium">Visit ID:</span>
                      <span className="font-bold text-stone-800 text-xs">#{selectedAppointmentDetails.visitId ?? 'N/A'}</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Footer - STICKY WITH ORGANIZED BUTTONS */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 rounded-b-3xl border-t-2 border-stone-200 flex justify-between items-center gap-4 flex-wrap flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAppointmentDetails(false)}
                className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg"
              >
                ✕ Close
              </motion.button>
              <div className="flex gap-3 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleEditAppointmentClick(selectedAppointmentDetails)}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>✏️</span>
                  <span>Edit</span>
                </motion.button>
                {currentPrescription && (
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrintPrescription}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                  >
                    <span>🖨️</span>
                    <span>Print</span>
                  </motion.button>
                )}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={async () => {
                    console.log('═══════════════════════════════════════════════════════');
                    console.log('🩺 DIAGNOSIS BUTTON CLICKED');
                    console.log('═══════════════════════════════════════════════════════');
                    console.log('📋 Selected Appointment:', selectedAppointmentDetails);
                    console.log('🆔 AppointmentID:', selectedAppointmentDetails.appointmentId);
                    
                    setSelectedAppointmentForVisit(selectedAppointmentDetails);
                    
                    try {
                      // Load inventory before opening modal
                      if (inventoryMeds.length === 0) {
                        console.log('📦 Loading inventory medications...');
                        await loadInventoryMedications();
                      } else {
                        console.log('✅ Inventory already loaded:', inventoryMeds.length, 'items');
                      }
                      
                      // Check if patient visit data already exists for this appointment
                      console.log('');
                      console.log('🔍 CHECKING FOR EXISTING VISIT DATA...');
                      console.log('📋 AppointmentID being sent:', selectedAppointmentDetails.appointmentId);
                      console.log('🌐 API Call: POST /Patient/GetPatientVisit?AppointmentID=' + selectedAppointmentDetails.appointmentId);
                      
                      const existingVisitData = await getPatientVisit(selectedAppointmentDetails.appointmentId);
                      
                      console.log('');
                      console.log('📥 API RESPONSE RECEIVED:');
                      console.log('Response data:', existingVisitData);
                      console.log('Has visitDate?', existingVisitData?.visitDate);
                      console.log('Has diagnosis?', existingVisitData?.diagnosis);
                      
                      if (existingVisitData && existingVisitData.visitDate) {
                        console.log('✅ EXISTING VISIT DATA FOUND - Loading into form');
                        console.log('Visit Date:', existingVisitData.visitDate);
                        console.log('Chief Complaint:', existingVisitData.chiefComplaint);
                        console.log('Diagnosis:', existingVisitData.diagnosis);
                        console.log('Prescriptions:', existingVisitData.prescriptions);
                        
                        // Data exists - we'll load it in the modal component
                        setSelectedAppointmentForVisit({
                          ...selectedAppointmentDetails,
                          existingVisitData: existingVisitData
                        });
                      } else {
                        console.log('📝 NO EXISTING VISIT DATA - Showing new form');
                        // No data exists - show empty form
                        setSelectedAppointmentForVisit(selectedAppointmentDetails);
                      }
                    } catch (error) {
                      console.log('');
                      console.log('⚠️ ERROR OR NO DATA:');
                      console.error('Error details:', error);
                      console.error('Error message:', error?.message);
                      console.error('Error response:', error?.response);
                      console.log('📝 Defaulting to empty form');
                      
                      // If API fails or returns no data, just show empty form
                      setSelectedAppointmentForVisit(selectedAppointmentDetails);
                    }
                    
                    console.log('🎯 Opening diagnosis modal...');
                    console.log('═══════════════════════════════════════════════════════');
                    setShowVisitInfoModal(true);
                    setShowAppointmentDetails(false);
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>🩺</span>
                  <span>Diagnosis</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Prescription Modal Component - ENHANCED with patient details & keyboard nav
  const commonMedications = [
    'Amoxicillin', 'Ibuprofen', 'Acetaminophen', 'Cephalexin', 'Metronidazole', 
    'Ciprofloxacin', 'Trimethoprim-Sulfamethoxazole', 'Clarithromycin',
    'Clindamycin', 'Tetracycline', 'Penicillin V', 'Azithromycin'
  ];

  const PrescriptionModal = () => {
    if (!showPrescriptionModal) return null;

    const [localPrescriptionForm, setLocalPrescriptionForm] = React.useState(prescriptionForm);
    const [medicationInput, setMedicationInput] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
    const [savingPrescription, setSavingPrescription] = useState(false);
    
    React.useEffect(() => {
      setLocalPrescriptionForm(prescriptionForm);
    }, [showPrescriptionModal]);
    
    // Sample medical conditions - in real app this would come from API
    const chronicDiseases = ['Diabetes', 'Hypertension', 'Asthma', 'Heart Disease', 'Kidney Disease'];
    const allergies = ['Penicillin', 'Aspirin', 'Iodine'];

    const addMedication = React.useCallback(() => {
      setLocalPrescriptionForm(prev => ({
        ...prev,
        medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
      }));
    }, []);

    const removeMedication = React.useCallback((index) => {
      setLocalPrescriptionForm(prev => ({
        ...prev,
        medications: prev.medications.filter((_, i) => i !== index)
      }));
    }, []);

    const updateMedication = React.useCallback((index, field, value) => {
      setLocalPrescriptionForm(prev => {
        const newMedications = [...prev.medications];
        newMedications[index][field] = value;
        return { ...prev, medications: newMedications };
      });
      
      if (field === 'name') {
        setMedicationInput(value);
        setShowSuggestions(value.length > 0);
        setSelectedSuggestion(-1);
        setCurrentMedicationIndex(index);
      }
    }, []);

    const handleMedicationKeyDown = (e, index) => {
      if (!showSuggestions) return;

      const filteredMeds = commonMedications.filter(med =>
        med.toLowerCase().includes(medicationInput.toLowerCase())
      );

      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestion(prev => 
            prev < filteredMeds.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestion >= 0) {
            updateMedication(index, 'name', filteredMeds[selectedSuggestion]);
            setShowSuggestions(false);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
        default:
          break;
      }
    };

    const getSuggestions = (input) => {
      if (!input) return [];
      return commonMedications.filter(med =>
        med.toLowerCase().includes(input.toLowerCase())
      );
    };

    const handleApplyPrescription = React.useCallback(() => {
      setPrescriptionForm(localPrescriptionForm);
      const validMedications = localPrescriptionForm.medications.filter(med => med.name && med.dosage);
      if (validMedications.length === 0) {
        alert('❌ Please add at least one medication with name and dosage.');
        return;
      }
      
      // Apply prescription to the diagnosis form
      const prescriptionText = validMedications
        .map(med => `${med.name} ${med.dosage}${med.frequency ? ' - ' + med.frequency : ''}${med.duration ? ' for ' + med.duration : ''}${med.instructions ? ' (' + med.instructions + ')' : ''}`)
        .join('\n');
      
      handleVisitFormChange('prescriptions', prescriptionText);
      setSavedPrescription({ medications: validMedications, notes: localPrescriptionForm.notes });
      alert('✅ Prescription applied successfully!');
      setShowPrescriptionModal(false);
    }, [localPrescriptionForm]);

    const handleSavePrescription = React.useCallback(async () => {
      setPrescriptionForm(localPrescriptionForm);
      const validMedications = localPrescriptionForm.medications.filter(med => med.name && med.dosage);
      if (validMedications.length === 0) {
        alert('❌ Please add at least one medication with name and dosage.');
        return;
      }

      setSavingPrescription(true);
      try {
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
        
        console.log('🔍 handleSavePrescription - Available data:');
        console.log('  selectedAppointmentForVisit:', selectedAppointmentForVisit);
        console.log('  userData:', userData);
        console.log('  selectedAccess:', selectedAccess);
        
        // Get IDs from correct sources
        const enterpriseId = selectedAccess?.enterpriseId || 0;
        const clinicId = selectedAccess?.clinicId || 0;
        const appointmentId = selectedAppointmentForVisit?.appointmentId || 0;
        const visitId = selectedAppointmentForVisit?.visitId || 0;
        const doctorId = selectedAppointmentForVisit?.doctorId || 0;  // Use from appointment, not userData
        let patientId = selectedAppointmentForVisit?.patientId || 0;
        
        console.log('📋 Extracted IDs:');
        console.log('  enterpriseId:', enterpriseId, '(from selectedAccess)');
        console.log('  clinicId:', clinicId, '(from selectedAccess)');
        console.log('  appointmentId:', appointmentId, '(from appointment)');
        console.log('  visitId:', visitId, '(from appointment - might be null)');
        console.log('  doctorId:', doctorId, '(from appointment)');
        console.log('  patientId:', patientId, '(from appointment)');
        console.log('🔍 Full appointment object:', selectedAppointmentForVisit);
        
        // Validate all required IDs (visitId can be 0/null, but others cannot)
        if (enterpriseId === 0 || clinicId === 0 || appointmentId === 0 || doctorId === 0) {
          const missing = [];
          if (enterpriseId === 0) missing.push('enterpriseId (from login)');
          if (clinicId === 0) missing.push('clinicId (from login)');
          if (appointmentId === 0) missing.push('appointmentId (from appointment)');
          if (doctorId === 0) missing.push('doctorId (from appointment)');
          
          alert(`❌ Missing required IDs: ${missing.join(', ')}\n\nCheck console for details.`);
          console.error('Missing IDs:', missing);
          setSavingPrescription(false);
          return;
        }
        
        // patientId validation - THIS IS THE ISSUE
        if (patientId === 0) {
          console.warn('⚠️  ALERT: patientId is 0 in the appointment object!');
          console.log('Available appointment fields:', Object.keys(selectedAppointmentForVisit));
          alert(`❌ ERROR: Cannot save prescription - Patient ID is missing from appointment!\n\nThe backend returned patientId: 0, which is invalid.\n\nPlease check:\n1. Is the appointment data complete?\n2. Does the patient exist in the system?`);
          setSavingPrescription(false);
          return;
        }
        
        // Save each medication separately using AddPrescription API
        for (const medication of validMedications) {
          const prescriptionPayload = {
            medicationId: 0,
            enterpriseId: enterpriseId,
            clinicId: clinicId,
            appointmentId: appointmentId,
            visitId: visitId,
            doctorId: doctorId,
            patientId: patientId,
            medicineName: medication.name,
            dosage: medication.dosage,
            frequency: medication.frequency,
            duration: medication.duration,
            specialInstructions: medication.instructions,
            generalPrescriptionNotes: localPrescriptionForm.notes || "",
            createdAt: new Date().toISOString(),
            createdBy: userData.username || "Doctor",
            updatedAt: new Date().toISOString(),
            updatedBy: userData.username || "Doctor"
          };

          console.log('📤 Sending payload for:', medication.name, prescriptionPayload);

          const response = await fetch('https://localhost:7104/api/Appointments/AddPrescription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
            },
            body: JSON.stringify(prescriptionPayload)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ API Error Response:', errorText);
            throw new Error(`Failed to save prescription: ${response.statusText} - ${errorText}`);
          }

          // Capture prescriptionId from response
          const responseData = await response.json();
          console.log('✅ Prescription saved successfully:', responseData);
          if (responseData?.prescriptionId) {
            setPrescriptionId(responseData.prescriptionId);
            console.log('📋 Stored prescriptionId:', responseData.prescriptionId);
          }
        }

        setSavedPrescription({ medications: validMedications, notes: localPrescriptionForm.notes });
        setShowPrescriptionSuccessModal(true);
        
        // Close prescription modal and show diagnosis page after success
        setTimeout(() => {
          setShowPrescriptionModal(false);
          setShowVisitInfoModal(true);
          setShowPrescriptionSuccessModal(false);
        }, 2000);
      } catch (error) {
        console.error('Failed to save prescription:', error);
        alert('❌ Failed to save prescription. Please try again.');
      } finally {
        setSavingPrescription(false);
      }
    }, [localPrescriptionForm, selectedAppointmentForVisit, setSavedPrescription]);

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[99999] p-4"
          onClick={() => setShowPrescriptionModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col"
          >
            {/* Header - STICKY */}
            <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 px-8 py-6 rounded-t-3xl flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    💊
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Write Prescription</h2>
                    <p className="text-pink-100 text-sm mt-1">
                      {selectedAppointmentForVisit?.firstName} {selectedAppointmentForVisit?.lastName} • ID: #{selectedAppointmentForVisit?.patientId}
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPrescriptionModal(false)}
                  className="flex-shrink-0 w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Body - Scrollable with Patient Context */}
            <div className="flex-1 overflow-y-auto p-8">
              {/* Patient Details & Medical Context - Always Visible on Scroll */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Patient Info Card */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="lg:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200 shadow-md h-fit"
                >
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span>👤</span> Patient Info
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex gap-3 pb-3 border-b border-blue-100">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                        {selectedAppointmentForVisit?.firstName?.charAt(0)}{selectedAppointmentForVisit?.lastName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-xs text-stone-600 font-medium">Name</p>
                        <p className="font-bold text-stone-800">{selectedAppointmentForVisit?.firstName} {selectedAppointmentForVisit?.lastName}</p>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-600">Phone:</span>
                        <span className="font-bold text-stone-800">{selectedAppointmentForVisit?.phoneNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600">Email:</span>
                        <span className="font-bold text-stone-800 truncate max-w-[140px]">{selectedAppointmentForVisit?.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Critical Allergies - WARNING */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 }}
                  className="lg:col-span-1 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border-2 border-red-300 shadow-lg ring-2 ring-red-200 h-fit"
                >
                  <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                    <span>🚨</span> ALLERGIES
                  </h3>
                  <div className="space-y-2">
                    {allergies.map((allergy, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-lg p-3 border-l-4 border-red-500 shadow-sm"
                      >
                        <p className="text-sm font-bold text-red-700">⚠️ {allergy}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Chronic Diseases */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="lg:col-span-1 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-6 border-2 border-amber-200 shadow-md h-fit"
                >
                  <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <span>⚠️</span> Medical Conditions
                  </h3>
                  <div className="space-y-2">
                    {chronicDiseases.map((disease, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-lg p-2 border-l-4 border-amber-400 shadow-sm"
                      >
                        <p className="text-xs font-semibold text-stone-800">• {disease}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Medications Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-md">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-purple-900 flex items-center gap-2">
                    <span>💊</span> Add Medications
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addMedication}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>➕</span>
                    <span>Add Medication</span>
                  </motion.button>
                </div>

                <div className="space-y-5">
                  {localPrescriptionForm.medications.map((med, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white rounded-2xl p-6 border-2 border-purple-300 shadow-md relative"
                    >
                      {localPrescriptionForm.medications.length > 1 && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => removeMedication(index)}
                          className="absolute top-4 right-4 text-red-500 hover:text-red-700 transition-colors p-2 hover:bg-red-100 rounded-lg"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </motion.button>
                      )}

                      <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                        <span className="bg-purple-200 text-purple-900 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </span>
                        <span>Medication</span>
                      </h4>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Medicine Name with Autofill */}
                        <div className="lg:col-span-1 relative">
                          <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Medicine Name <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => updateMedication(index, 'name', e.target.value)}
                              onKeyDown={(e) => handleMedicationKeyDown(e, index)}
                              onFocus={() => {
                                setMedicationInput(med.name);
                                if (med.name.length > 0) setShowSuggestions(true);
                              }}
                              onClick={() => {
                                setMedicationInput(med.name);
                                setShowSuggestions(true);
                                setCurrentMedicationIndex(index);
                              }}
                              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                              placeholder="Click to select or type to search..."
                              className="w-full px-4 py-3 pr-10 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition cursor-pointer"
                            />
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none text-purple-500">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                          
                          {/* Autocomplete Suggestions - Keyboard Navigation Ready + Add to Inventory */}
                          {showSuggestions && med.name.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="absolute top-full mt-1 w-full bg-white border-2 border-purple-300 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
                            >
                              {getSuggestions(med.name).length > 0 ? (
                                getSuggestions(med.name).map((suggestion, idx) => (
                                  <motion.div
                                    key={idx}
                                    onClick={() => {
                                      updateMedication(index, 'name', suggestion);
                                      setShowSuggestions(false);
                                    }}
                                    className={`px-4 py-2.5 cursor-pointer transition-all ${
                                      selectedSuggestion === idx
                                        ? 'bg-purple-500 text-white font-semibold'
                                        : 'hover:bg-purple-100 text-stone-800'
                                    }`}
                                  >
                                    {suggestion}
                                  </motion.div>
                                ))
                              ) : (
                                <div className="p-2">
                                  <div className="px-4 py-2.5 text-stone-600 text-sm mb-2 border-b border-stone-200">
                                    🔍 No matches found for "{med.name}"
                                  </div>
                                  <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                      setNewMedicationName(med.name);
                                      setShowAddMedicationModal(true);
                                      setShowSuggestions(false);
                                    }}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-bold shadow-md hover:shadow-xl transition-all flex items-center justify-center gap-2"
                                  >
                                    <span>➕</span>
                                    <span>Add "{med.name}" to Inventory</span>
                                  </motion.button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </div>

                        {/* Dosage */}
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">
                            Dosage <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                            placeholder="e.g., 500mg"
                            className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                          />
                        </div>

                        {/* Frequency */}
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Frequency</label>
                          <input
                            type="text"
                            value={med.frequency}
                            onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                            placeholder="e.g., 3 times a day"
                            className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                          />
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Duration</label>
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                            placeholder="e.g., 7 days"
                            className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                          />
                        </div>

                        {/* Special Instructions */}
                        <div className="lg:col-span-3">
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Special Instructions</label>
                          <textarea
                            value={med.instructions}
                            onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                            placeholder="e.g., Take after meals, avoid dairy products"
                            rows={2}
                            className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition resize-none"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* General Notes */}
                <div className="mt-6 pt-6 border-t-2 border-purple-300">
                  <label className="block text-sm font-semibold text-stone-700 mb-2">General Prescription Notes</label>
                  <textarea
                    value={localPrescriptionForm.notes || ''}
                    onChange={(e) => setLocalPrescriptionForm({...localPrescriptionForm, notes: e.target.value})}
                    placeholder="e.g., Follow-up in 1 week, take with water"
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer - STICKY */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 rounded-b-3xl border-t-2 border-stone-200 flex justify-between items-center gap-4 flex-wrap flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPrescriptionModal(false)}
                className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg"
              >
                ✕ Close
              </motion.button>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (localPrescriptionForm.medications.filter(m => m.name && m.dosage).length > 0) {
                      setPrescriptionForm(localPrescriptionForm);
                      setShowPrintPreviewModal(true);
                    }
                  }}
                  disabled={localPrescriptionForm.medications.filter(m => m.name && m.dosage).length === 0}
                  className={`px-8 py-2.5 rounded-lg font-bold text-white transition shadow-lg flex items-center gap-2 ${
                    localPrescriptionForm.medications.filter(m => m.name && m.dosage).length === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-2xl'
                  }`}
                >
                  <span>🖨️</span>
                  <span>Print Preview</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleApplyPrescription}
                  disabled={localPrescriptionForm.medications.filter(m => m.name && m.dosage).length === 0}
                  className={`px-8 py-2.5 rounded-lg font-bold text-white transition shadow-lg flex items-center gap-2 ${
                    localPrescriptionForm.medications.filter(m => m.name && m.dosage).length === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-2xl'
                  }`}
                >
                  <span>✓</span>
                  <span>Apply to Diagnosis</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSavePrescription}
                  disabled={savingPrescription || localPrescriptionForm.medications.filter(m => m.name && m.dosage).length === 0}
                  className={`px-8 py-2.5 rounded-lg font-bold text-white transition shadow-lg flex items-center gap-2 ${
                    savingPrescription || localPrescriptionForm.medications.filter(m => m.name && m.dosage).length === 0
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:shadow-2xl'
                  }`}
                >
                  <span>💾</span>
                  <span>{savingPrescription ? 'Saving...' : 'Save Prescription'}</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // View Prescription Modal Component
  const ViewPrescriptionModal = () => {
    if (!showViewPrescriptionModal) return null;

    const [isEditMode, setIsEditMode] = React.useState(false);
    const [editedPrescription, setEditedPrescription] = React.useState(currentPrescription);
    const [isSavingPrescription, setIsSavingPrescription] = React.useState(false);

    // Parse medications from prescription content
    const parseMedications = (content) => {
      if (!content) return [];
      // Content is in format: "MedicineName - Dosage Frequency for Duration (Instructions)"
      const lines = content.split('\n').filter(l => l.trim());
      return lines.map(line => {
        // Parse each medication line
        const match = line.match(/^([^-]+)\s*-\s*([^(]*?)(?:\s*\(([^)]*)\))?$/);
        if (match) {
          const parts = match[2].trim().split(' for ');
          const dosageFreq = parts[0] || '';
          const duration = parts[1] || '';
          return {
            name: match[1].trim(),
            dosageFreq: dosageFreq,
            duration: duration,
            instructions: match[3] || ''
          };
        }
        return { name: line, dosageFreq: '', duration: '', instructions: '' };
      });
    };

    const medications = parseMedications(editedPrescription?.prescriptionContent);

    const handleMedicationChange = (index, field, value) => {
      const newMeds = [...medications];
      newMeds[index][field] = value;
      // Reconstruct prescription content
      const newContent = newMeds.map(med => {
        let str = `${med.name} - ${med.dosageFreq} for ${med.duration}`;
        if (med.instructions) str += ` (${med.instructions})`;
        return str;
      }).join('\n');
      setEditedPrescription({ ...editedPrescription, prescriptionContent: newContent });
    };

    const handleAddMedication = () => {
      const newMeds = [...medications, { name: '', dosageFreq: '', duration: '', instructions: '' }];
      const newContent = newMeds.map(med => {
        let str = `${med.name} - ${med.dosageFreq} for ${med.duration}`;
        if (med.instructions) str += ` (${med.instructions})`;
        return str;
      }).filter(s => s.trim()).join('\n');
      setEditedPrescription({ ...editedPrescription, prescriptionContent: newContent });
    };

    const handleRemoveMedication = (index) => {
      const newMeds = medications.filter((_, i) => i !== index);
      const newContent = newMeds.map(med => {
        let str = `${med.name} - ${med.dosageFreq} for ${med.duration}`;
        if (med.instructions) str += ` (${med.instructions})`;
        return str;
      }).join('\n');
      setEditedPrescription({ ...editedPrescription, prescriptionContent: newContent });
    };

    const handleSaveChanges = async () => {
      try {
        setIsSavingPrescription(true);
        const userData = JSON.parse(localStorage.getItem("userData") || "{}");
        const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");

        // Update each medication
        const validMeds = medications.filter(m => m.name && m.dosageFreq && m.duration);
        for (const med of validMeds) {
          const payload = {
            medicationId: 0,
            enterpriseId: selectedAccess.enterpriseId || 0,
            clinicId: selectedAccess.clinicId || 0,
            appointmentId: editedPrescription?.appointmentId || 0,
            visitId: 0,
            doctorId: userData.doctorId || 0,
            patientId: editedPrescription?.patientId || 0,
            medicineName: med.name,
            dosage: med.dosageFreq.split(' ')[0] || '',
            frequency: med.dosageFreq.split(' for ')[0]?.trim().split(' ').pop() || '',
            duration: med.duration,
            specialInstructions: med.instructions || "",
            generalPrescriptionNotes: "",
            createdAt: new Date().toISOString(),
            createdBy: userData.username || "Doctor",
            updatedAt: new Date().toISOString(),
            updatedBy: userData.username || "Doctor"
          };

          await updatePrescriptionData(payload);
        }

        setCurrentPrescription(editedPrescription);
        setIsEditMode(false);
        alert('✅ Prescription updated successfully!');
      } catch (error) {
        console.error('Error saving prescriptions:', error);
        alert('❌ Failed to save prescriptions');
      } finally {
        setIsSavingPrescription(false);
      }
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowViewPrescriptionModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">📋 Prescription Details {isEditMode && '(Edit Mode)'}</h2>
                <p className="text-indigo-100 text-sm mt-1">Patient: {editedPrescription?.patientId || 'N/A'}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowViewPrescriptionModal(false)}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-2 rounded-lg transition"
              >
                ✕
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              {!editedPrescription ? (
                <div className="text-center py-12">
                  <p className="text-slate-600 font-semibold">No prescription found</p>
                </div>
              ) : (
                <>
                  {/* Medications Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-gradient-to-r from-indigo-100 to-purple-100">
                          <th className="border border-indigo-300 px-4 py-3 text-left font-bold">Medicine Name</th>
                          <th className="border border-indigo-300 px-4 py-3 text-left font-bold">Dosage & Frequency</th>
                          <th className="border border-indigo-300 px-4 py-3 text-left font-bold">Duration</th>
                          <th className="border border-indigo-300 px-4 py-3 text-left font-bold">Instructions</th>
                          {isEditMode && <th className="border border-indigo-300 px-4 py-3 text-center font-bold">Action</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {medications.map((med, idx) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-indigo-50'}>
                            <td className="border border-indigo-200 px-4 py-3">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  value={med.name}
                                  onChange={(e) => handleMedicationChange(idx, 'name', e.target.value)}
                                  className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                                />
                              ) : (
                                <span className="font-semibold text-slate-900">{med.name}</span>
                              )}
                            </td>
                            <td className="border border-indigo-200 px-4 py-3">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  value={med.dosageFreq}
                                  onChange={(e) => handleMedicationChange(idx, 'dosageFreq', e.target.value)}
                                  className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                                  placeholder="e.g., 500mg twice daily"
                                />
                              ) : (
                                med.dosageFreq
                              )}
                            </td>
                            <td className="border border-indigo-200 px-4 py-3">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  value={med.duration}
                                  onChange={(e) => handleMedicationChange(idx, 'duration', e.target.value)}
                                  className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                                  placeholder="e.g., 5 days"
                                />
                              ) : (
                                med.duration
                              )}
                            </td>
                            <td className="border border-indigo-200 px-4 py-3">
                              {isEditMode ? (
                                <input
                                  type="text"
                                  value={med.instructions}
                                  onChange={(e) => handleMedicationChange(idx, 'instructions', e.target.value)}
                                  className="w-full px-2 py-1 border border-indigo-300 rounded focus:ring-2 focus:ring-indigo-500"
                                  placeholder="e.g., Take with food"
                                />
                              ) : (
                                med.instructions || '-'
                              )}
                            </td>
                            {isEditMode && (
                              <td className="border border-indigo-200 px-4 py-3 text-center">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => handleRemoveMedication(idx)}
                                  className="text-red-500 hover:text-red-700 font-bold"
                                >
                                  ✕
                                </motion.button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {isEditMode && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddMedication}
                      className="w-full px-4 py-3 border-2 border-dashed border-indigo-400 rounded-xl text-indigo-700 font-semibold hover:bg-indigo-50 transition"
                    >
                      ➕ Add Another Medication
                    </motion.button>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-stone-50 border-t-2 border-stone-200 px-8 py-4 flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (isEditMode) {
                    setEditedPrescription(currentPrescription);
                  }
                  setIsEditMode(!isEditMode);
                }}
                className={`px-6 py-2.5 rounded-lg font-semibold transition flex items-center gap-2 ${
                  isEditMode
                    ? 'bg-gray-400 text-white hover:bg-gray-500'
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg'
                }`}
              >
                <span>{isEditMode ? '✕ Cancel' : '✏️ Edit Prescription'}</span>
              </motion.button>
              {isEditMode && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveChanges}
                  disabled={isSavingPrescription}
                  className={`px-6 py-2.5 font-semibold rounded-lg transition flex items-center gap-2 ${
                    isSavingPrescription
                      ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
                  }`}
                >
                  <span>💾 Save Changes</span>
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowViewPrescriptionModal(false)}
                className="px-6 py-2.5 bg-white border-2 border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-50 font-semibold rounded-lg transition"
              >
                ✕ Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Add Medication to Inventory Modal Component
  const AddMedicationModal = () => {
    if (!showAddMedicationModal) return null;

    const [medicationData, setMedicationData] = React.useState({
      itemName: newMedicationName || '',
      itemCode: '',
      categoryName: 'Medication',
      subCategory: '',
      dosageForms: '',
      manufacturer: '',
      genericName: '',
      unitOfMeasure: 'Unit',
      reorderLevel: 10,
      isActive: true
    });
    const [isSaving, setIsSaving] = React.useState(false);

    const handleInputChange = React.useCallback((field, value) => {
      setMedicationData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSaveMedication = async () => {
      if (!medicationData.itemName.trim()) {
        alert('❌ Please enter medication name');
        return;
      }

      setIsSaving(true);
      try {
        const payload = {
          ...medicationData,
          itemCode: medicationData.itemCode || `MED-${Date.now()}`,
          reorderLevel: parseInt(medicationData.reorderLevel) || 10
        };

        await createInventoryMaster(payload);
        
        alert(`✅ "${medicationData.itemName}" has been added to inventory successfully!`);
        
        // Update commonMedications list (in real app, refetch from API)
        commonMedications.push(medicationData.itemName);
        
        // Update the current medication in prescription form
        if (currentMedicationIndex >= 0) {
          updateMedication(currentMedicationIndex, 'name', medicationData.itemName);
        }
        
        setShowAddMedicationModal(false);
        setNewMedicationName('');
      } catch (error) {
        console.error('Failed to add medication:', error);
        alert('❌ Failed to add medication to inventory. Please try again.');
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100000] p-4"
          onClick={() => setShowAddMedicationModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 px-8 py-6 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    ➕
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-white">Add New Medication</h2>
                    <p className="text-green-100 text-sm mt-1">Add medication to inventory master</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddMedicationModal(false)}
                  className="w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Body - Scrollable Form */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200 shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Medication Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Medication Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={medicationData.itemName}
                      onChange={(e) => handleInputChange('itemName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition font-semibold"
                      placeholder="e.g., Amoxicillin"
                    />
                  </div>

                  {/* Item Code */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Item Code</label>
                    <input
                      type="text"
                      value={medicationData.itemCode}
                      onChange={(e) => handleInputChange('itemCode', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="Auto-generated if empty"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Category</label>
                    <select
                      value={medicationData.categoryName}
                      onChange={(e) => handleInputChange('categoryName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    >
                      <option value="Medication">Medication</option>
                      <option value="Analgesics">Analgesics</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Anesthetics">Anesthetics</option>
                      <option value="Antiseptics">Antiseptics</option>
                      <option value="Anti-inflammatory">Anti-inflammatory</option>
                    </select>
                  </div>

                  {/* Sub-category */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Sub-category</label>
                    <input
                      type="text"
                      value={medicationData.subCategory}
                      onChange={(e) => handleInputChange('subCategory', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="e.g., Penicillin"
                    />
                  </div>

                  {/* Dosage Forms */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Dosage Forms</label>
                    <input
                      type="text"
                      value={medicationData.dosageForms}
                      onChange={(e) => handleInputChange('dosageForms', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="e.g., Tablet, Capsule, Syrup"
                    />
                  </div>

                  {/* Manufacturer */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Manufacturer</label>
                    <input
                      type="text"
                      value={medicationData.manufacturer}
                      onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="e.g., Pfizer, GSK"
                    />
                  </div>

                  {/* Generic Name */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Generic Name</label>
                    <input
                      type="text"
                      value={medicationData.genericName}
                      onChange={(e) => handleInputChange('genericName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="Chemical/Generic name"
                    />
                  </div>

                  {/* Unit of Measure */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Unit of Measure</label>
                    <select
                      value={medicationData.unitOfMeasure}
                      onChange={(e) => handleInputChange('unitOfMeasure', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    >
                      <option value="Unit">Unit</option>
                      <option value="Box">Box</option>
                      <option value="Strip">Strip</option>
                      <option value="Bottle">Bottle</option>
                      <option value="Vial">Vial</option>
                    </select>
                  </div>

                  {/* Reorder Level */}
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Reorder Level</label>
                    <input
                      type="number"
                      value={medicationData.reorderLevel}
                      onChange={(e) => handleInputChange('reorderLevel', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                      placeholder="10"
                      min="1"
                    />
                  </div>

                  {/* Active Status */}
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={medicationData.isActive}
                        onChange={(e) => handleInputChange('isActive', e.target.checked)}
                        className="w-5 h-5 rounded border-green-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm font-semibold text-stone-700">Active Item (Available for use)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 border-t-2 border-stone-200 flex justify-end gap-3 flex-shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddMedicationModal(false)}
                disabled={isSaving}
                className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg disabled:opacity-50"
              >
                ✕ Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSaveMedication}
                disabled={isSaving || !medicationData.itemName.trim()}
                className={`px-8 py-2.5 rounded-lg font-bold text-white transition shadow-lg flex items-center gap-2 ${
                  isSaving || !medicationData.itemName.trim()
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 hover:shadow-2xl'
                }`}
              >
                <span>{isSaving ? '⏳' : '✅'}</span>
                <span>{isSaving ? 'Saving...' : 'Add to Inventory'}</span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Print Preview Modal Component
  const PrintPreviewModal = () => {
    if (!showPrintPreviewModal) return null;

    const printRef = useRef(null);
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");

    const handlePrint = () => {
      if (printRef.current) {
        window.print();
      }
    };

    const handleEmailShare = () => {
      const patientEmail = selectedAppointmentForVisit?.email || 'patient@example.com';
      const prescriptionText = prescriptionForm.medications
        .map(m => `${m.name} - ${m.dosage} - ${m.frequency}`)
        .join('\n');
      
      const subject = `Prescription from ${SAMPLE_CLINIC_DETAILS.clinicName}`;
      const body = `Dear Patient,\n\nHere is your prescription:\n\n${prescriptionText}\n\nBest regards,\n${userData.username || 'Dr.'}\n${SAMPLE_CLINIC_DETAILS.clinicName}`;
      
      window.location.href = `mailto:${patientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    const handleWhatsAppShare = () => {
      const patientPhone = selectedAppointmentForVisit?.phoneNumber?.replace(/\D/g, '') || '';
      const prescriptionText = prescriptionForm.medications
        .map(m => `${m.name} - ${m.dosage} - ${m.frequency}`)
        .join('\n');
      
      const message = `Hello! Here is your prescription from ${SAMPLE_CLINIC_DETAILS.clinicName}:\n\n${prescriptionText}\n\nThank you!`;
      const whatsappUrl = `https://wa.me/91${patientPhone}?text=${encodeURIComponent(message)}`;
      
      window.open(whatsappUrl, '_blank');
    };

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[99999] p-4"
          onClick={() => setShowPrintPreviewModal(false)}
        >
          <motion.div
            ref={printRef}
            initial={{ scale: 0.9, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden print:rounded-none print:shadow-none"
          >
            {/* Print Header - Not visible on print */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-5 rounded-t-3xl print:hidden">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>🖨️</span> Prescription Print Preview
                </h2>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPrintPreviewModal(false)}
                  className="w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Printable Content */}
            <div className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
              {/* Clinic Header */}
              <div className="text-center mb-8 pb-8 border-b-2 border-stone-300">
                <h1 className="text-4xl font-bold text-stone-900 mb-2">{SAMPLE_CLINIC_DETAILS.clinicName}</h1>
                <p className="text-stone-600 text-lg mb-4">📍 {SAMPLE_CLINIC_DETAILS.address}</p>
                <div className="flex justify-center gap-6 text-sm text-stone-600">
                  <div className="flex items-center gap-2">
                    <span>📞</span>
                    <span>{SAMPLE_CLINIC_DETAILS.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📧</span>
                    <span>{SAMPLE_CLINIC_DETAILS.email}</span>
                  </div>
                </div>
              </div>

              {/* Doctor & Patient Info */}
              <div className="grid grid-cols-2 gap-12 mb-8">
                <div>
                  <h3 className="font-bold text-stone-900 mb-2">Dr. {userData.username || 'Doctor Name'}</h3>
                  <p className="text-sm text-stone-600">Registration No: {userData.registrationNumber || 'MH-12345'}</p>
                  <p className="text-sm text-stone-600">Specialization: Dentistry</p>
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 mb-2">Patient Information</h3>
                  <p className="text-sm text-stone-600">Name: {selectedAppointmentForVisit?.firstName} {selectedAppointmentForVisit?.lastName}</p>
                  <p className="text-sm text-stone-600">ID: #{selectedAppointmentForVisit?.patientId}</p>
                  <p className="text-sm text-stone-600">Date: {new Date().toLocaleDateString('en-IN')}</p>
                </div>
              </div>

              {/* Medications Table */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-stone-900 mb-4 border-b-2 border-stone-300 pb-2">Prescribed Medications</h2>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-blue-100">
                      <th className="border border-stone-300 px-4 py-2 text-left font-bold">Medicine Name</th>
                      <th className="border border-stone-300 px-4 py-2 text-left font-bold">Dosage</th>
                      <th className="border border-stone-300 px-4 py-2 text-left font-bold">Frequency</th>
                      <th className="border border-stone-300 px-4 py-2 text-left font-bold">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prescriptionForm.medications.map((med, idx) => (
                      med.name && med.dosage && (
                        <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50'}>
                          <td className="border border-stone-300 px-4 py-3">{med.name}</td>
                          <td className="border border-stone-300 px-4 py-3">{med.dosage}</td>
                          <td className="border border-stone-300 px-4 py-3">{med.frequency || '-'}</td>
                          <td className="border border-stone-300 px-4 py-3">{med.duration || '-'}</td>
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions */}
              {prescriptionForm.medications.some(m => m.instructions) && (
                <div className="mb-8 bg-blue-50 rounded-lg p-6 border-2 border-blue-200">
                  <h3 className="font-bold text-stone-900 mb-2 text-lg">Special Instructions:</h3>
                  <div className="space-y-2">
                    {prescriptionForm.medications.map((med, idx) => (
                      med.instructions && (
                        <p key={idx} className="text-stone-700">
                          <strong>{med.name}:</strong> {med.instructions}
                        </p>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* General Notes */}
              {prescriptionForm.notes && (
                <div className="mb-8 bg-amber-50 rounded-lg p-6 border-2 border-amber-200">
                  <h3 className="font-bold text-stone-900 mb-2 text-lg">Additional Notes:</h3>
                  <p className="text-stone-700">{prescriptionForm.notes}</p>
                </div>
              )}

              {/* Signature Area */}
              <div className="mt-16 flex justify-end">
                <div className="text-center">
                  <div className="h-20 border-t-2 border-stone-400 mb-2 w-40"></div>
                  <p className="font-bold text-stone-900">Dr. {userData.username || 'Doctor Name'}</p>
                  <p className="text-sm text-stone-600">Signature & Stamp</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-12 pt-8 border-t-2 border-stone-300 text-center text-xs text-stone-600">
                <p>This is a computer-generated prescription. Signature on soft copy is valid.</p>
                <p>{SAMPLE_CLINIC_DETAILS.clinicName} • {SAMPLE_CLINIC_DETAILS.operatingHours}</p>
              </div>
            </div>

            {/* Action Buttons - Not visible on print */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 border-t-2 border-stone-200 flex justify-between items-center gap-4 flex-wrap print:hidden">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowPrintPreviewModal(false)}
                className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg"
              >
                ✕ Close
              </motion.button>
              <div className="flex gap-3 flex-wrap">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEmailShare}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>📧</span>
                  <span>Email</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleWhatsAppShare}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>💬</span>
                  <span>WhatsApp</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePrint}
                  className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>🖨️</span>
                  <span>Print</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };
  const BookAppointmentModal = () => {
    if (!bookingModalOpen) return null;
    
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
          onClick={() => setBookingModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-6 py-4 sticky top-0 z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  ➕ Book New Appointment
                </h2>
                <button
                  onClick={() => setBookingModalOpen(false)}
                  className="text-white/80 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Patient Information */}
              <div>
                <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <span>👤</span> Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Patient Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newAppointment.patient}
                      onChange={(e) => setNewAppointment({ ...newAppointment, patient: e.target.value })}
                      placeholder="Enter patient name"
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={newAppointment.phone}
                      onChange={(e) => setNewAppointment({ ...newAppointment, phone: e.target.value })}
                      placeholder="+1 (555) 123-4567"
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newAppointment.email}
                      onChange={(e) => setNewAppointment({ ...newAppointment, email: e.target.value })}
                      placeholder="patient@example.com"
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    />
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="border-t border-stone-200 pt-4">
                <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                  <span>📅</span> Appointment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">
                      Appointment Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newAppointment.type}
                      onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    >
                      <option value="">Select type</option>
                      <option value="Checkup">Checkup</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Filling">Filling</option>
                      <option value="Root Canal">Root Canal</option>
                      <option value="Crown">Crown</option>
                      <option value="Extraction">Extraction</option>
                      <option value="Consultation">Consultation</option>
                      <option value="Emergency">Emergency</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-1">Assigned Doctor</label>
                    <select
                      value={newAppointment.doctor}
                      onChange={(e) => setNewAppointment({ ...newAppointment, doctor: e.target.value })}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
                    >
                      <option value="">Select doctor</option>
                      <option value="Dr. Smith">Dr. Smith</option>
                      <option value="Dr. Johnson">Dr. Johnson</option>
                      <option value="Dr. Williams">Dr. Williams</option>
                      <option value="Dr. Brown">Dr. Brown</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
                    <textarea
                      value={newAppointment.notes}
                      onChange={(e) => setNewAppointment({ ...newAppointment, notes: e.target.value })}
                      placeholder="Any additional notes or special requirements..."
                      rows={3}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-stone-50 px-6 py-4 flex justify-end gap-3 border-t border-stone-200 sticky bottom-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setBookingModalOpen(false)}
                className="px-6 py-2 text-stone-600 hover:text-stone-800 font-semibold transition"
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleBookAppointment}
                className="px-6 py-2 rounded-lg font-semibold text-white transition shadow-md bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
              >
                Book Appointment
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Prescription Success Modal
  const PrescriptionSuccessModal = () => {
    if (!showPrescriptionSuccessModal) return null;

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[99999]"
          onClick={() => setShowPrescriptionSuccessModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 px-8 py-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <span className="text-6xl">✅</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mt-4">Success!</h2>
            </div>

            {/* Content */}
            <div className="px-8 py-6 text-center">
              <p className="text-stone-700 text-lg font-semibold mb-2">
                Prescription Saved Successfully! 🎉
              </p>
              <p className="text-stone-600 text-sm">
                All medications have been saved. Redirecting to diagnosis page...
              </p>
            </div>

            {/* Footer */}
            <div className="px-8 py-4 bg-stone-50 border-t border-stone-200">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowPrescriptionSuccessModal(false);
                  setShowPrescriptionModal(false);
                  setShowVisitInfoModal(true);
                }}
                className="w-full px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Go to Diagnosis Page
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  // Success Modal Component
  const SuccessModal = () => {
    if (!showUpdateSuccessModal) return null;

    const funnyMessages = [
      "🎉 Appointment updated successfully! Your calendar is now perfectly organized!",
      "✨ Update complete! Even your appointment time is excited to be changed!",
      "🚀 Boom! Appointment details have been rocketed into the system!",
      "🎊 Success! The appointment fairy has blessed these changes!",
      "💫 Done and dusted! Your appointment is now perfectly pristine!",
      "🌟 Mission accomplished! Time to celebrate with a coffee! ☕",
      "🎯 Bull's eye! Your appointment update was spot-on!",
      "🏆 Victory! Your appointment has been updated to perfection!",
      "🎪 Voilà! The appointment magician has done his trick!",
      "💪 Appointment slayed! Updates were handled like a boss!"
    ];

    const randomMessage = updateSuccessMessage || funnyMessages[Math.floor(Math.random() * funnyMessages.length)];

    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
          onClick={() => {
            setShowUpdateSuccessModal(false);
            setUpdateSuccessMessage("");
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 px-8 py-8 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <span className="text-6xl">✅</span>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mt-4">Success!</h2>
            </div>

            {/* Body */}
            <div className="p-8 text-center space-y-4">
              <p className="text-lg font-semibold text-stone-800">
                {randomMessage}
              </p>
              <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                <p className="text-sm text-green-700">
                  Your appointment has been updated in the system and all changes have been saved.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-4 border-t border-stone-200">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowUpdateSuccessModal(false);
                  setUpdateSuccessMessage("");
                }}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Got it! 👍
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      {/* Spacer for header and nav */}
      <div className="h-[148px]"></div>
      
      {/* Animated Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 mb-6 mt-4"
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
            className="absolute bottom-0 left-0 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl"
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
                👨‍⚕️
              </motion.span>
              Doctor's Clinical Dashboard
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-purple-50"
            >
              Manage appointments, patients, and clinic operations efficiently
            </motion.p>
          </div>
        </div>
      </motion.div>
      
      {/* Sidebar Toggle Button - Outside the sidebar */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ 
          opacity: 1,
          x: 0,
          left: isSidebarCollapsed ? "64px" : "280px"
        }}
        transition={{ 
          opacity: { duration: 0.3, delay: 0.2 },
          x: { duration: 0.3, delay: 0.2 },
          left: { duration: 0.35, ease: "easeInOut" }
        }}
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        whileHover={{ 
          scale: 1.1, 
          boxShadow: "0 4px 20px rgba(99, 102, 241, 0.25)",
          backgroundColor: "rgba(255, 255, 255, 1)"
        }}
        whileTap={{ scale: 0.9 }}
        className="fixed top-[180px] w-5 h-12 bg-white/90 backdrop-blur-sm rounded-r-lg shadow-lg flex items-center justify-center text-indigo-600 hover:text-indigo-700 transition-all border border-l-0 border-indigo-100 hover:border-indigo-200 z-[60]"
        style={{
          clipPath: "polygon(0 0, 100% 15%, 100% 85%, 0 100%)"
        }}
      >
        <motion.svg
          animate={{ 
            rotate: isSidebarCollapsed ? 180 : 0,
            x: isSidebarCollapsed ? -1 : 1
          }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          <path
            d="M10 12L6 8L10 4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </motion.button>

      {/* Left Sidebar Navigation */}
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ 
          x: 0,
          opacity: 1,
          width: isSidebarCollapsed ? "64px" : "280px"
        }}
        transition={{ 
          x: { duration: 0.5, ease: "easeOut" },
          opacity: { duration: 0.5 },
          width: { duration: 0.35, ease: "easeInOut" }
        }}
        className="bg-gradient-to-b from-indigo-600 via-purple-600 to-pink-600 shadow-2xl fixed left-0 top-[148px] h-[calc(100vh-148px)] z-50 rounded-tr-3xl border-t-4 border-white/20"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
        }}
      >
        <style>{`
          aside::-webkit-scrollbar {
            width: 6px;
          }
          aside::-webkit-scrollbar-track {
            background: transparent;
          }
          aside::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 3px;
          }
          aside::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
        `}</style>

        <div className={`transition-all duration-300 ${isSidebarCollapsed ? 'p-3' : 'p-5'}`}>
          {/* Header - Clickable to expand sidebar */}
          <motion.div 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`flex items-center mb-5 pb-5 border-b border-white/20 cursor-pointer hover:bg-white/10 rounded-lg transition-all ${isSidebarCollapsed ? 'justify-center flex-col gap-2 p-2' : 'gap-3 p-2'}`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              whileHover={{ rotate: 360, scale: 1.1 }}
              transition={{ duration: 0.6 }}
              className={`bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border-2 border-white/30 transition-all duration-300 relative ${isSidebarCollapsed ? 'w-10 h-10 text-xl' : 'w-12 h-12 text-2xl'}`}
            >
              👨‍⚕️
              {/* Expand indicator when collapsed */}
              {isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-400 rounded-full flex items-center justify-center text-white text-[10px] shadow-lg"
                >
                  »
                </motion.div>
              )}
            </motion.div>
            <AnimatePresence mode="wait">
              {!isSidebarCollapsed && (
                <motion.div
                  key="header-text"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <h2 className="text-white font-bold text-lg whitespace-nowrap">Doctor's Space</h2>
                  <p className="text-indigo-100 text-xs whitespace-nowrap">{(() => {
                    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
                    return userData.username || 'Doctor';
                  })()}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Dashboard Section */}
          <div className="mb-4">
            {/* Dashboard Header - Collapsible (VS Code Style) */}
            <motion.button
              onClick={() => setIsDashboardExpanded(!isDashboardExpanded)}
              className={`w-full flex items-center justify-between mb-2 px-2 py-1.5 hover:bg-white/10 rounded transition-all group ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              {!isSidebarCollapsed ? (
                <>
                  <h3 className="text-white/90 text-xs font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                    📊 Dashboard
                  </h3>
                  <motion.svg
                    animate={{ 
                      rotate: isDashboardExpanded ? 180 : 0,
                      y: isDashboardExpanded ? 0 : [0, -2, 0]
                    }}
                    transition={{ 
                      rotate: { duration: 0.3 },
                      y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-white/60"
                  >
                    <path
                      d="M3 5L6 8L9 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </>
              ) : (
                <div className="relative">
                  <span className="text-xl">📊</span>
                  <motion.div
                    animate={{ 
                      scale: isDashboardExpanded ? 1 : [1, 1.2, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 rounded-full"
                  />
                </div>
              )}
            </motion.button>
            
            {/* Dashboard Items */}
            <AnimatePresence>
              {isDashboardExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden space-y-1"
                >
                  {dashboardTabs.map((tab) => (
                    <motion.button
                      key={tab.key}
                      onClick={() => {
                        setActiveSection("dashboard");
                        setActiveTab(tab.key);
                      }}
                      whileHover={{ x: isSidebarCollapsed ? 0 : 3, scale: isSidebarCollapsed ? 1.08 : 1 }}
                      whileTap={{ scale: 0.95 }}
                      title={isSidebarCollapsed ? tab.label : ""}
                      className={`w-full flex items-center rounded-lg font-medium transition-all ${
                        isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'
                      } ${
                        activeSection === "dashboard" && activeTab === tab.key
                          ? "bg-white text-indigo-700 shadow-md"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className={`transition-all flex-shrink-0 ${
                        isSidebarCollapsed ? 'text-lg' : 'text-base'
                      }`}>{tab.icon}</span>
                      <AnimatePresence mode="wait">
                        {!isSidebarCollapsed && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden whitespace-nowrap text-xs"
                          >
                            {tab.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/20 my-4"></div>

          {/* Manage Clinic Section */}
          <div className="mb-4">
            {/* Manage Clinic Header - Collapsible (VS Code Style) */}
            <motion.button
              onClick={() => setIsManageExpanded(!isManageExpanded)}
              className={`w-full flex items-center justify-between mb-2 px-2 py-1.5 hover:bg-white/10 rounded transition-all group ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
              {!isSidebarCollapsed ? (
                <>
                  <h3 className="text-white/90 text-xs font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                    🏛️ Manage Clinic
                  </h3>
                  <motion.svg
                    animate={{ 
                      rotate: isManageExpanded ? 180 : 0,
                      y: isManageExpanded ? 0 : [0, -2, 0]
                    }}
                    transition={{ 
                      rotate: { duration: 0.3 },
                      y: { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
                    }}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    className="text-white/60"
                  >
                    <path
                      d="M3 5L6 8L9 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                </>
              ) : (
                <div className="relative">
                  <span className="text-xl">🏛️</span>
                  <motion.div
                    animate={{ 
                      scale: isManageExpanded ? 1 : [1, 1.2, 1]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-1 -right-1 w-2 h-2 bg-white/60 rounded-full"
                  />
                </div>
              )}
            </motion.button>
            
            {/* Manage Clinic Items */}
            <AnimatePresence>
              {isManageExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden space-y-1"
                >
                  {manageClinicTabs.map((tab) => (
                    <motion.button
                      key={tab.key}
                      onClick={() => {
                        setActiveSection("manage");
                        setActiveTab(tab.key);
                      }}
                      whileHover={{ x: isSidebarCollapsed ? 0 : 3, scale: isSidebarCollapsed ? 1.08 : 1 }}
                      whileTap={{ scale: 0.95 }}
                      title={isSidebarCollapsed ? tab.label : ""}
                      className={`w-full flex items-center rounded-lg font-medium transition-all ${
                        isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-2.5 px-3 py-2.5'
                      } ${
                        activeSection === "manage" && activeTab === tab.key
                          ? "bg-white text-indigo-700 shadow-md"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <span className={`transition-all flex-shrink-0 ${
                        isSidebarCollapsed ? 'text-lg' : 'text-base'
                      }`}>{tab.icon}</span>
                      <AnimatePresence mode="wait">
                        {!isSidebarCollapsed && (
                          <motion.span
                            key="label"
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: "auto" }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden whitespace-nowrap text-xs"
                          >
                            {tab.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Actions */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate("/")}
              className={`w-full flex items-center justify-center bg-white/20 backdrop-blur-md text-white rounded-lg font-semibold hover:bg-white/30 transition shadow-md border border-white/30 ${
                isSidebarCollapsed ? 'px-2 py-2.5 gap-0' : 'px-3 py-2.5 gap-2'
              }`}
              title={isSidebarCollapsed ? "Back to Home" : ""}
            >
              <span className={`transition-all ${
                isSidebarCollapsed ? 'text-lg' : 'text-sm'
              }`}>←</span>
              <AnimatePresence mode="wait">
                {!isSidebarCollapsed && (
                  <motion.span
                    key="back-text"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden whitespace-nowrap text-xs"
                  >
                    Back to Home
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1,
          y: 0,
          marginLeft: isSidebarCollapsed ? "64px" : "280px",
          paddingLeft: isSidebarCollapsed ? "2rem" : "2.5rem"
        }}
        transition={{ 
          opacity: { duration: 0.5, delay: 0.3 },
          y: { duration: 0.5, delay: 0.3 },
          marginLeft: { duration: 0.35, ease: "easeInOut" },
          paddingLeft: { duration: 0.35, ease: "easeInOut" }
        }}
        className="flex-1 pb-12 pr-8 pt-6 min-h-[calc(100vh-148px)]" style={{ marginTop: 0 }}
      >
        <AnimatePresence mode="wait">
          {/* Dashboard Section Tabs */}
          {activeSection === "dashboard" && activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Welcome Card */}
              <div className="bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/40 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100/60 p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    👨‍⚕️
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent">
                      Welcome, Dr. Smith
                    </h2>
                    <p className="text-stone-600 text-sm mt-1">Here's your practice overview for today</p>
                  </div>
                </div>

                {/* Quick Stats Grid - Navigatable Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("appointments")}
                    className="bg-gradient-to-br from-blue-50 to-indigo-100/50 rounded-xl p-5 border border-blue-200/50 shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">📅</span>
                      <span className="text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Today</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">{SAMPLE_CLINIC_DETAILS.todayAppointments}</p>
                    <p className="text-xs text-stone-600 mt-1 font-medium">Appointments</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("patients")}
                    className="bg-gradient-to-br from-emerald-50 to-teal-100/50 rounded-xl p-5 border border-emerald-200/50 shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">👥</span>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <p className="text-3xl font-bold text-emerald-700">{SAMPLE_PATIENTS.length}</p>
                    <p className="text-xs text-stone-600 mt-1 font-medium">Patients</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("payments")}
                    className="bg-gradient-to-br from-amber-50 to-orange-100/50 rounded-xl p-5 border border-amber-200/50 shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">💰</span>
                      <span className="text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">Pending</span>
                    </div>
                    <p className="text-3xl font-bold text-amber-700">{SAMPLE_CLINIC_DETAILS.pendingPayments}</p>
                    <p className="text-xs text-stone-600 mt-1 font-medium">Payments</p>
                  </motion.div>

                  <motion.div
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setActiveTab("inventory")}
                    className="bg-gradient-to-br from-violet-50 to-purple-100/50 rounded-xl p-5 border border-violet-200/50 shadow-md cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">🪑</span>
                      <span className="text-xs font-semibold text-violet-600 bg-violet-100 px-2 py-1 rounded-full">Available</span>
                    </div>
                    <p className="text-3xl font-bold text-violet-700">{SAMPLE_CLINIC_DETAILS.chairsAvailable}</p>
                    <p className="text-xs text-stone-600 mt-1 font-medium">Chairs</p>
                  </motion.div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming Appointments Preview */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                      <span>📅</span> Next Appointments
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab("appointments")}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-3 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      View All →
                    </motion.button>
                  </div>
                  <div className="space-y-3">
                    {SAMPLE_APPOINTMENTS.filter(a => a.status === "Confirmed").slice(0, 3).map((appt) => (
                      <motion.div
                        key={appt.id}
                        whileHover={{ x: 5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab("appointments")}
                        className="flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 cursor-pointer transition-all hover:shadow-md"
                      >
                        <div>
                          <p className="font-semibold text-stone-800 text-sm">{appt.patient}</p>
                          <p className="text-xs text-stone-600">{appt.type} • {appt.time}</p>
                        </div>
                        <span className="text-xs font-semibold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full">
                          {appt.date}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Critical Inventory Alerts */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-rose-100/60 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-rose-900 flex items-center gap-2">
                      <span>⚠️</span> Inventory Alerts
                    </h3>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab("inventory")}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      View All →
                    </motion.button>
                  </div>
                  <div className="space-y-3">
                    {SAMPLE_INVENTORY.filter(i => i.status !== "In Stock").slice(0, 3).map((item) => (
                      <motion.div
                        key={item.id}
                        whileHover={{ x: 5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab("inventory")}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                          item.status === "Critical" ? "bg-rose-50 border-rose-200" : "bg-amber-50 border-amber-200"
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-stone-800 text-sm">{item.item}</p>
                          <p className="text-xs text-stone-600">Available: {item.available} • Reorder: {item.reorderLevel}</p>
                        </div>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                          item.status === "Critical" ? "bg-rose-200 text-rose-700" : "bg-amber-200 text-amber-700"
                        }`}>
                          {item.status}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Clinic Details Tab */}
          {activeSection === "dashboard" && activeTab === "clinic" && (
            <motion.div
              key="clinic"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-teal-100/60 p-8">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                    🏥
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-700 via-cyan-700 to-blue-700 bg-clip-text text-transparent">
                      {SAMPLE_CLINIC_DETAILS.clinicName}
                    </h2>
                    <p className="text-stone-600 text-sm">Clinic Information & Statistics</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="w-1 h-4 bg-gradient-to-b from-teal-500 to-cyan-600 rounded-full"></span>
                        Contact Information
                      </h3>
                      <div className="space-y-4 text-sm">
                        <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                          <span className="text-teal-600 text-lg">📍</span>
                          <span className="text-stone-700 flex-1">{SAMPLE_CLINIC_DETAILS.address}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                          <span className="text-teal-600 text-lg">📞</span>
                          <span className="text-stone-700">{SAMPLE_CLINIC_DETAILS.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                          <span className="text-teal-600 text-lg">✉️</span>
                          <span className="text-stone-700">{SAMPLE_CLINIC_DETAILS.email}</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl">
                          <span className="text-teal-600 text-lg">🕒</span>
                          <span className="text-stone-700">{SAMPLE_CLINIC_DETAILS.operatingHours}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-teal-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-teal-500 to-sage-500 rounded-full"></span>
                      Clinic Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-5 border border-teal-200/50 shadow-md"
                      >
                        <p className="text-3xl font-bold text-teal-700">{SAMPLE_CLINIC_DETAILS.totalStaff}</p>
                        <p className="text-xs text-stone-600 mt-2 font-medium">Total Staff</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200/50 shadow-md"
                      >
                        <p className="text-3xl font-bold text-blue-700">{SAMPLE_CLINIC_DETAILS.activeDoctors}</p>
                        <p className="text-xs text-stone-600 mt-2 font-medium">Active Doctors</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border border-indigo-200/50 shadow-md"
                      >
                        <p className="text-3xl font-bold text-indigo-700">{SAMPLE_CLINIC_DETAILS.chairsAvailable}</p>
                        <p className="text-xs text-stone-600 mt-2 font-medium">Chairs Available</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.05, rotate: 1 }}
                        className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-200/50 shadow-md"
                      >
                        <p className="text-3xl font-bold text-purple-700">{SAMPLE_PATIENTS.length}</p>
                        <p className="text-xs text-stone-600 mt-2 font-medium">Active Patients</p>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Patient Details Tab */}
          {activeSection === "dashboard" && activeTab === "patients" && (
            <motion.div
              key="patients"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-blue-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        👥
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                          My Patients
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Complete patient registry and records</p>
                      </div>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate("/patients?view=list")}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      <span>👁️</span>
                      <span>View All Patients</span>
                    </motion.button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Patient Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Last Visit</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Next Appointment</th>
                        <th className="px-6 py-3 text-right font-semibold text-stone-700">Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_PATIENTS.map((patient, idx) => (
                        <motion.tr
                          key={patient.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-stone-100 hover:bg-teal-50/30 transition"
                        >
                          <td className="px-6 py-4 font-medium text-stone-800">{patient.name}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(patient.status)}`}>
                              {patient.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-stone-600">{patient.lastVisit}</td>
                          <td className="px-6 py-4 text-stone-600">{patient.nextAppt}</td>
                          <td className="px-6 py-4 text-right font-semibold text-stone-800">
                            ₹{patient.balance.toLocaleString('en-IN')}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Payment Status Tab */}
          {activeSection === "dashboard" && activeTab === "payments" && (
            <motion.div
              key="payments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-emerald-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      💳
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
                        Payment Status
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Track all patient payments and outstanding balances</p>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Patient</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Date</th>
                        <th className="px-6 py-3 text-right font-semibold text-stone-700">Amount</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Method</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_PAYMENTS.map((payment, idx) => (
                        <motion.tr
                          key={payment.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-stone-100 hover:bg-teal-50/30 transition"
                        >
                          <td className="px-6 py-4 font-medium text-stone-800">{payment.patient}</td>
                          <td className="px-6 py-4 text-stone-600">{payment.date}</td>
                          <td className="px-6 py-4 text-right font-semibold text-stone-800">₹{payment.amount.toLocaleString('en-IN')}</td>
                          <td className="px-6 py-4 text-stone-600">{payment.method}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Appointments Tab */}
          {activeSection === "dashboard" && activeTab === "appointments" && (
            <motion.div
              key="appointments"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-violet-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-violet-50 to-purple-50 border-b border-violet-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        📅
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-violet-700 to-purple-700 bg-clip-text text-transparent">
                          Appointments & Cancellations
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Upcoming appointments and recent cancellations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigate("/calendar")}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                      >
                        <span>📆</span>
                        <span>Calendar View</span>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleOpenBooking}
                        className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                      >
                        <span>➕</span>
                        <span>Book New Appointment</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                {/* Date Filter and My Appointments Controls */}
                <div className="px-6 py-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-stone-700">Filter by Date:</label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={(e) => setAppointmentDate(e.target.value)}
                      className="px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={loadAllAppointments}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        !viewingMyAppointments 
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md' 
                          : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <span>📋</span>
                      <span>All Appointments</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={loadMyAppointments}
                      className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                        viewingMyAppointments 
                          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md' 
                          : 'bg-white text-stone-700 border border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      <span>👨‍⚕️</span>
                      <span>My Appointments</span>
                    </motion.button>
                  </div>
                  {viewingMyAppointments && (
                    <div className="text-sm text-stone-600 font-medium bg-violet-100 px-3 py-1.5 rounded-full">
                      Showing your appointments only
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  {loadingAppointments ? (
                    <div className="p-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent"></div>
                      <p className="mt-4 text-stone-600 font-medium">Loading appointments...</p>
                    </div>
                  ) : realAppointments.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="text-6xl mb-4">📅</div>
                      <h3 className="text-xl font-bold text-stone-700 mb-2">No Appointments Found</h3>
                      <p className="text-stone-500">There are no appointments scheduled for this clinic.</p>
                    </div>
                  ) : (
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {realAppointments.map((appt, idx) => (
                        <motion.div
                          key={appt.appointmentId}
                          initial={{ opacity: 0, scale: 0.95, y: 20 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: idx * 0.05, type: "spring" }}
                          className="relative group"
                        >
                          {/* Gradient Background Blur */}
                          <div className="absolute inset-0 bg-gradient-to-br from-violet-300 via-purple-300 to-pink-300 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition-all duration-300"></div>
                          
                          {/* Card Content */}
                          <div className="relative bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-violet-200 hover:border-violet-400">
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(appt.status || 'Scheduled')}`}>
                                {appt.status || 'Scheduled'}
                              </span>
                            </div>
                            
                            {/* Patient Info */}
                            <div className="mb-4 pr-20">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                                  {appt.firstName?.charAt(0)}{appt.lastName?.charAt(0)}
                                </div>
                                <div>
                                  <h3 className="font-bold text-lg text-stone-800">
                                    {appt.firstName} {appt.lastName}
                                  </h3>
                                  <p className="text-xs text-stone-500">Patient ID: {appt.patientId}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Appointment Details */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-lg">📅</span>
                                <span className="font-semibold text-stone-700">Date:</span>
                                <span className="text-stone-600">
                                  {appt.appointmentDate ? new Date(appt.appointmentDate).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : 'N/A'}
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-lg">⏰</span>
                                <span className="font-semibold text-stone-700">Time:</span>
                                <span className="text-stone-600">{appt.startTime || 'N/A'}</span>
                              </div>
                              
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-lg">🏥</span>
                                <span className="font-semibold text-stone-700">Type:</span>
                                <span className="text-stone-600">{appt.appointmentType || 'General'}</span>
                              </div>
                              
                              {appt.attendingPhysician && (
                                <div className="flex items-center gap-2 text-sm">
                                  <span className="text-lg">👨‍⚕️</span>
                                  <span className="font-semibold text-stone-700">Doctor:</span>
                                  <span className="text-stone-600">{appt.attendingPhysician}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Action Button */}
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={async () => {
                                // Show quick view then hydrate with full data from API
                                setSelectedAppointmentDetails(appt);
                                setShowAppointmentDetails(true);

                                const hydrated = await fetchAppointmentDetails(appt);
                                setSelectedAppointmentDetails(hydrated);
                                setShowAppointmentDetails(true);
                              }}
                              className="w-full mt-3 py-2.5 bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
                            >
                              <span>📋</span>
                              <span>View Details</span>
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Inventory Tab */}
          {activeSection === "dashboard" && activeTab === "inventory" && (
            <motion.div
              key="inventory"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-amber-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        📦
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-orange-700 bg-clip-text text-transparent">
                          Clinic Inventory
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Manage inventory items and place orders</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAddNewItem}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-medium hover:shadow-lg transition text-sm"
                      >
                        + Add Item
                      </button>
                      {newItems.length > 0 && (
                        <button
                          onClick={handleSaveNewItems}
                          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg transition text-sm"
                        >
                          Save New Items
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Existing Inventory Items */}
                    {inventoryItems.map((item, idx) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 hover:shadow-lg transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-stone-800 text-sm mb-1">{item.item}</h3>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                              {item.category}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-xs mb-4">
                          <div className="flex justify-between items-center">
                            <span className="text-stone-600">Available:</span>
                            <span className="font-bold text-stone-800 text-base">{item.available}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-stone-600">On Order:</span>
                            <span className="font-semibold text-stone-700">{item.ordered || 0}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-stone-600">Reorder Level:</span>
                            <span className="font-semibold text-stone-700">{item.reorderLevel}</span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handlePlaceOrder(item)}
                          className="w-full px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg font-semibold hover:from-amber-700 hover:to-orange-700 transition text-sm shadow-md"
                        >
                          Place Order
                        </button>
                      </motion.div>
                    ))}
                    
                    {/* New Item Entry Cards */}
                    {newItems.map((newItem) => (
                      <motion.div
                        key={newItem.tempId}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-dashed border-emerald-300 rounded-xl p-4"
                      >
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Item Name *</label>
                            <input
                              type="text"
                              value={newItem.item}
                              onChange={(e) => handleNewItemChange(newItem.tempId, 'item', e.target.value)}
                              placeholder="Enter item name"
                              className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-stone-700 mb-1">Category *</label>
                            <input
                              type="text"
                              value={newItem.category}
                              onChange={(e) => handleNewItemChange(newItem.tempId, 'category', e.target.value)}
                              placeholder="e.g., Supplies, Medication"
                              className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">Quantity *</label>
                              <input
                                type="number"
                                value={newItem.available}
                                onChange={(e) => handleNewItemChange(newItem.tempId, 'available', e.target.value)}
                                placeholder="0"
                                className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-stone-700 mb-1">Reorder At</label>
                              <input
                                type="number"
                                value={newItem.reorderLevel}
                                onChange={(e) => handleNewItemChange(newItem.tempId, 'reorderLevel', e.target.value)}
                                placeholder="10"
                                className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <button
                            onClick={() => setNewItems(newItems.filter(item => item.tempId !== newItem.tempId))}
                            className="w-full px-3 py-2 bg-rose-100 text-rose-700 rounded-lg font-semibold hover:bg-rose-200 transition text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Order Modal */}
              <AnimatePresence>
                {orderModalOpen && orderItem && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setOrderModalOpen(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-amber-200"
                    >
                      <div className="p-6 border-b border-stone-200 bg-gradient-to-r from-amber-50 to-orange-50">
                        <h3 className="text-xl font-bold text-amber-900">Place Order</h3>
                        <p className="text-sm text-stone-600 mt-1">Submit a purchase order for inventory replenishment</p>
                      </div>
                      
                      <div className="p-6 space-y-4">
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                          <label className="block text-xs font-semibold text-stone-600 mb-1">Item</label>
                          <p className="text-lg font-bold text-stone-800">{orderItem.item}</p>
                          <p className="text-xs text-stone-600 mt-1">Category: {orderItem.category}</p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Quantity Required *</label>
                          <input
                            type="number"
                            value={orderQuantity}
                            onChange={(e) => setOrderQuantity(e.target.value)}
                            placeholder="Enter quantity to order"
                            min="1"
                            className="w-full px-4 py-3 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-2">Vendor *</label>
                          <select
                            value={selectedVendor}
                            onChange={(e) => setSelectedVendor(e.target.value)}
                            className="w-full px-4 py-3 border border-stone-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                          >
                            <option value="">Select a vendor</option>
                            {vendors.map((vendor, idx) => (
                              <option key={idx} value={vendor}>{vendor}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-xs text-blue-800">
                            <span className="font-semibold">Current Stock:</span> {orderItem.available} units<br/>
                            <span className="font-semibold">Reorder Level:</span> {orderItem.reorderLevel} units
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-6 border-t border-stone-200 flex gap-3">
                        <button
                          onClick={() => setOrderModalOpen(false)}
                          className="flex-1 px-4 py-3 border border-stone-300 rounded-lg text-stone-700 font-semibold hover:bg-stone-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmOrder}
                          disabled={!orderQuantity || !selectedVendor}
                          className={`flex-1 px-4 py-3 rounded-lg font-semibold transition ${
                            orderQuantity && selectedVendor
                              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-md'
                              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                          }`}
                        >
                          Place Order
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Success Modal */}
              <AnimatePresence>
                {successModalOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                    onClick={() => setSuccessModalOpen(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-emerald-200 text-center"
                    >
                      <div className="p-8">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                          className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-full flex items-center justify-center text-white text-4xl shadow-lg"
                        >
                          ✓
                        </motion.div>
                        <h3 className="text-2xl font-bold text-emerald-700 mb-2">Order Placed Successfully!</h3>
                        <p className="text-stone-600 mb-6">
                          Your order has been submitted and will be processed shortly.
                        </p>
                        <button
                          onClick={() => setSuccessModalOpen(false)}
                          className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:from-emerald-700 hover:to-teal-700 transition shadow-md"
                        >
                          Continue
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Manage Clinic - Clinic Settings Tab */}
          {activeSection === "manage" && activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-purple-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      ⚙️
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent">
                        Clinic Settings
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Manage clinic information and preferences</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Clinic Name</label>
                      <input type="text" defaultValue="Dentaesthetics Central Clinic" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Registration Number</label>
                      <input type="text" defaultValue="DC-2024-001" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Address</label>
                      <input type="text" defaultValue="123 Dental Street, Medical District, Paris" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Contact Email</label>
                      <input type="email" defaultValue="contact@dentaesthetics.com" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Phone Number</label>
                      <input type="tel" defaultValue="+33 1 23 45 67 89" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Specialties</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["General Dentistry", "Orthodontics", "Cosmetic Dentistry", "Implantology", "Pediatric Dentistry"].map(specialty => (
                          <span key={specialty} className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                            {specialty} ×
                          </span>
                        ))}
                        <button className="px-3 py-1.5 border-2 border-dashed border-purple-300 text-purple-600 rounded-full text-sm font-medium hover:bg-purple-50 transition">
                          + Add Specialty
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-stone-700 mb-2">Insurance Providers Accepted</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {["AXA Health", "Allianz Care", "April International", "MSH International", "Cigna Global"].map(insurance => (
                          <span key={insurance} className="px-3 py-1.5 bg-pink-100 text-pink-700 rounded-full text-sm font-medium">
                            {insurance} ×
                          </span>
                        ))}
                        <button className="px-3 py-1.5 border-2 border-dashed border-pink-300 text-pink-600 rounded-full text-sm font-medium hover:bg-pink-50 transition">
                          + Add Provider
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                    <button className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium hover:bg-stone-50 transition">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Staff Management Tab */}
          {activeSection === "manage" && activeTab === "staff" && (
            <motion.div
              key="staff"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-teal-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        👥
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-teal-700 to-emerald-700 bg-clip-text text-transparent">
                          Staff Management
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Manage clinic staff and their schedules</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      + Add Staff
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Name</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Role</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Specialty</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Schedule</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Contact</th>
                        <th className="px-6 py-3 text-center font-semibold text-stone-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "Dr. Sophie Martin", role: "Senior Dentist", specialty: "Cosmetic Dentistry", schedule: "Mon-Fri 9AM-5PM", contact: "+33 6 12 34 56 78" },
                        { name: "Dr. Jean Dubois", role: "Orthodontist", specialty: "Orthodontics", schedule: "Tue-Sat 10AM-6PM", contact: "+33 6 23 45 67 89" },
                        { name: "Marie Lefevre", role: "Dental Hygienist", specialty: "Preventive Care", schedule: "Mon-Fri 8AM-4PM", contact: "+33 6 34 56 78 90" },
                        { name: "Pierre Bernard", role: "Dental Assistant", specialty: "General Support", schedule: "Mon-Fri 9AM-5PM", contact: "+33 6 45 67 89 01" },
                        { name: "Claire Moreau", role: "Receptionist", specialty: "Front Desk", schedule: "Mon-Fri 8AM-6PM", contact: "+33 6 56 78 90 12" }
                      ].map((staff, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-stone-100 hover:bg-teal-50/30 transition"
                        >
                          <td className="px-6 py-4 font-medium text-stone-800">{staff.name}</td>
                          <td className="px-6 py-4 text-stone-600">{staff.role}</td>
                          <td className="px-6 py-4 text-stone-600">{staff.specialty}</td>
                          <td className="px-6 py-4 text-stone-600 text-xs">{staff.schedule}</td>
                          <td className="px-6 py-4 text-stone-600 text-xs">{staff.contact}</td>
                          <td className="px-6 py-4 text-center">
                            <button className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg text-xs font-medium hover:bg-teal-200 transition mr-2">
                              Edit
                            </button>
                            <button className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium hover:bg-rose-200 transition">
                              Remove
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Schedule & Hours Tab */}
          {activeSection === "manage" && activeTab === "schedule" && (
            <motion.div
              key="schedule"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-indigo-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      📅
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-700 to-blue-700 bg-clip-text text-transparent">
                        Schedule & Operating Hours
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Configure clinic operating hours and holidays</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
                      <div key={day} className="flex items-center gap-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
                        <input type="checkbox" defaultChecked={day !== "Sunday"} className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" />
                        <div className="flex-1">
                          <p className="font-semibold text-stone-800">{day}</p>
                          <div className="flex gap-2 mt-2">
                            <input type="time" defaultValue="09:00" className="px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                            <span className="text-stone-500">to</span>
                            <input type="time" defaultValue="18:00" className="px-2 py-1 border border-stone-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Holidays & Closures</h3>
                    <div className="space-y-2">
                      {[
                        { date: "2024-12-25", name: "Christmas Day" },
                        { date: "2024-01-01", name: "New Year's Day" },
                        { date: "2024-07-14", name: "Bastille Day" }
                      ].map((holiday, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                          <div>
                            <p className="font-medium text-stone-800">{holiday.name}</p>
                            <p className="text-sm text-stone-600">{holiday.date}</p>
                          </div>
                          <button className="px-3 py-1 bg-rose-100 text-rose-700 rounded-lg text-xs font-medium hover:bg-rose-200 transition">
                            Remove
                          </button>
                        </div>
                      ))}
                      <button className="w-full px-4 py-2 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition">
                        + Add Holiday
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                    <button className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium hover:bg-stone-50 transition">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      Save Schedule
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Billing & Insurance Tab */}
          {activeSection === "manage" && activeTab === "billing" && (
            <motion.div
              key="billing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-rose-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-rose-50 to-pink-50 border-b border-rose-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      💳
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-rose-700 to-pink-700 bg-clip-text text-transparent">
                        Billing & Insurance
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">Manage payment methods and insurance settings</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div>
                    <h3 className="font-bold text-stone-800 mb-4">Payment Methods Accepted</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Mobile Payment", "Cheque"].map(method => (
                        <label key={method} className="flex items-center gap-2 p-3 bg-stone-50 rounded-lg border border-stone-200 cursor-pointer hover:bg-rose-50 transition">
                          <input type="checkbox" defaultChecked className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500" />
                          <span className="text-sm font-medium text-stone-700">{method}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Service Fee Schedule</h3>
                    <div className="space-y-2">
                      {[
                        { service: "General Consultation", fee: "€50" },
                        { service: "Teeth Cleaning", fee: "€80" },
                        { service: "Tooth Extraction", fee: "€120" },
                        { service: "Dental Filling", fee: "€90" },
                        { service: "Root Canal", fee: "€350" },
                        { service: "Teeth Whitening", fee: "€200" }
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-rose-50 rounded-lg">
                          <span className="font-medium text-stone-800">{item.service}</span>
                          <span className="text-rose-700 font-bold">{item.fee}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Tax & Regulatory Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">VAT Number</label>
                        <input type="text" defaultValue="FR12345678901" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Tax Rate (%)</label>
                        <input type="number" defaultValue="20" className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500" />
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4 border-t border-stone-200">
                    <button className="px-6 py-2 border border-stone-300 rounded-lg text-stone-700 font-medium hover:bg-stone-50 transition">
                      Cancel
                    </button>
                    <button className="px-6 py-2 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Reports & Analytics Tab */}
          {activeSection === "manage" && activeTab === "reports" && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-amber-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                      📊
                    </div>
                    <div>
                      <h2 className="text-xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent">
                        Reports & Analytics
                      </h2>
                      <p className="text-sm text-stone-600 mt-0.5">View clinic performance and statistics</p>
                    </div>
                  </div>
                </div>
                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                      <p className="text-sm text-stone-600 mb-1">Monthly Revenue</p>
                      <p className="text-3xl font-bold text-amber-700">€45,280</p>
                      <p className="text-xs text-emerald-600 mt-2">↑ 12.5% from last month</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl border border-teal-200">
                      <p className="text-sm text-stone-600 mb-1">Total Patients</p>
                      <p className="text-3xl font-bold text-teal-700">1,247</p>
                      <p className="text-xs text-emerald-600 mt-2">↑ 8.3% from last month</p>
                    </div>
                    <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-200">
                      <p className="text-sm text-stone-600 mb-1">Appointments</p>
                      <p className="text-3xl font-bold text-indigo-700">342</p>
                      <p className="text-xs text-rose-600 mt-2">↓ 3.2% from last month</p>
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Quick Reports</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { name: "Daily Appointments Summary", icon: "📋" },
                        { name: "Revenue by Service Type", icon: "💰" },
                        { name: "Patient Demographics", icon: "👥" },
                        { name: "Treatment Success Rates", icon: "✅" },
                        { name: "Insurance Claims Report", icon: "📄" },
                        { name: "Inventory Usage Analysis", icon: "📦" }
                      ].map((report, idx) => (
                        <button key={idx} className="flex items-center gap-3 p-4 bg-stone-50 rounded-lg border border-stone-200 hover:bg-amber-50 hover:border-amber-300 transition text-left">
                          <span className="text-2xl">{report.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-stone-800">{report.name}</p>
                            <p className="text-xs text-stone-500 mt-0.5">Click to generate</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-stone-200 pt-6">
                    <h3 className="font-bold text-stone-800 mb-4">Custom Report Builder</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Report Type</label>
                        <select className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                          <option>Revenue Analysis</option>
                          <option>Patient Statistics</option>
                          <option>Appointment Trends</option>
                          <option>Treatment Analysis</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-stone-700 mb-2">Date Range</label>
                        <select className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500">
                          <option>Last 7 Days</option>
                          <option>Last 30 Days</option>
                          <option>Last 3 Months</option>
                          <option>Custom Range</option>
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button className="w-full px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                          Generate Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Manage Clinic - Equipment & Assets Tab */}
          {activeSection === "manage" && activeTab === "equipment" && (
            <motion.div
              key="equipment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-orange-100/60 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-2xl shadow-md">
                        🦷
                      </div>
                      <div>
                        <h2 className="text-xl font-bold bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent">
                          Equipment & Assets
                        </h2>
                        <p className="text-sm text-stone-600 mt-0.5">Manage clinic equipment and maintenance</p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-lg font-medium hover:shadow-lg transition">
                      + Add Equipment
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-stone-50 border-b border-stone-200">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Equipment</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Serial Number</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Purchase Date</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Last Maintenance</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Next Maintenance</th>
                        <th className="px-6 py-3 text-left font-semibold text-stone-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { equipment: "Dental Chair Unit #1", serial: "DC-2023-001", purchase: "2023-01-15", lastMaint: "2024-10-20", nextMaint: "2025-01-20", status: "Operational" },
                        { equipment: "X-Ray Machine", serial: "XR-2022-045", purchase: "2022-06-10", lastMaint: "2024-11-05", nextMaint: "2025-02-05", status: "Operational" },
                        { equipment: "Autoclave Sterilizer", serial: "AS-2023-012", purchase: "2023-03-20", lastMaint: "2024-11-28", nextMaint: "2024-12-28", status: "Due Soon" },
                        { equipment: "Ultrasonic Scaler", serial: "US-2021-089", purchase: "2021-09-12", lastMaint: "2024-09-15", nextMaint: "2024-12-15", status: "Due Soon" },
                        { equipment: "LED Curing Light", serial: "LC-2024-003", purchase: "2024-02-01", lastMaint: "2024-11-01", nextMaint: "2025-02-01", status: "Operational" },
                        { equipment: "Intraoral Camera", serial: "IC-2022-078", purchase: "2022-11-30", lastMaint: "2024-08-10", nextMaint: "2024-11-10", status: "Overdue" }
                      ].map((item, idx) => (
                        <motion.tr
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="border-b border-stone-100 hover:bg-orange-50/30 transition"
                        >
                          <td className="px-6 py-4 font-medium text-stone-800">{item.equipment}</td>
                          <td className="px-6 py-4 text-stone-600 text-xs">{item.serial}</td>
                          <td className="px-6 py-4 text-stone-600 text-xs">{item.purchase}</td>
                          <td className="px-6 py-4 text-stone-600 text-xs">{item.lastMaint}</td>
                          <td className="px-6 py-4 text-stone-600 text-xs">{item.nextMaint}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              item.status === "Operational" ? "bg-emerald-100 text-emerald-700" :
                              item.status === "Due Soon" ? "bg-amber-100 text-amber-700" :
                              "bg-rose-100 text-rose-700"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-6 bg-stone-50 border-t border-stone-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white rounded-lg border border-stone-200">
                      <p className="text-sm text-stone-600 mb-1">Total Equipment Value</p>
                      <p className="text-2xl font-bold text-orange-700">€124,500</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-stone-200">
                      <p className="text-sm text-stone-600 mb-1">Maintenance This Month</p>
                      <p className="text-2xl font-bold text-teal-700">3 Items</p>
                    </div>
                    <div className="p-4 bg-white rounded-lg border border-stone-200">
                      <p className="text-sm text-stone-600 mb-1">Overdue Maintenance</p>
                      <p className="text-2xl font-bold text-rose-700">1 Item</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Edit Appointment Modal */}
      <EditAppointmentModal />
      
      {/* Book Appointment Modal */}
      <BookAppointmentModal />
      
      {/* Appointment Details Modal */}
      <AppointmentDetailsModal />
      
      {/* Visit Info Modal */}
      <VisitInfoModal />
      
      {/* Prescription Modal */}
      <PrescriptionModal />

      {/* Print Preview Modal */}
      <PrintPreviewModal />

      {/* Add Medication to Inventory Modal */}
      <AddMedicationModal />

      {/* Prescription Writing Modal */}
      <PrescriptionWritingModal
        isOpen={showPrescriptionWritingModal}
        onClose={() => setShowPrescriptionWritingModal(false)}
        patientInfo={selectedAppointmentDetails}
        medicalHistory={patientMedicalInfo}
        doctorInfo={{
          doctorId: JSON.parse(localStorage.getItem("userData") || "{}").doctorId || 0,
          doctorName: JSON.parse(localStorage.getItem("userData") || "{}").username || "Doctor",
          registrationNumber: JSON.parse(localStorage.getItem("userData") || "{}").registrationNumber || ""
        }}
        appointmentId={selectedAppointmentDetails?.appointmentId}
        appointmentDetails={selectedAppointmentDetails}
        onSavePrescription={handleSavePrescription}
      />

      {/* View Prescription Modal */}
      <AnimatePresence>
        {showViewPrescriptionModal && viewedPrescription && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowViewPrescriptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 sticky top-0 z-10 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>👁️</span> View Prescription
                </h2>
                <button
                  onClick={() => setShowViewPrescriptionModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="p-8 space-y-6">
                {/* Prescription Details */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200">
                  <h3 className="text-lg font-bold text-indigo-900 mb-4">Prescription Details</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-stone-600 font-medium">Prescription ID</p>
                      <p className="font-bold text-stone-800">#{viewedPrescription.prescriptionId}</p>
                    </div>
                    <div>
                      <p className="text-stone-600 font-medium">Appointment ID</p>
                      <p className="font-bold text-stone-800">#{viewedPrescription.appointmentId}</p>
                    </div>
                    <div>
                      <p className="text-stone-600 font-medium">Created By</p>
                      <p className="font-bold text-stone-800">{viewedPrescription.createdBy}</p>
                    </div>
                    <div>
                      <p className="text-stone-600 font-medium">Created Date</p>
                      <p className="font-bold text-stone-800">
                        {new Date(viewedPrescription.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Medications List */}
                {viewedPrescription.medicationsJson && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200">
                    <h3 className="text-lg font-bold text-green-900 mb-4">Medications</h3>
                    <div className="space-y-3">
                      {typeof viewedPrescription.medicationsJson === 'string' 
                        ? JSON.parse(viewedPrescription.medicationsJson).map((med, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                              <p className="font-bold text-stone-800">{med.name} - {med.dosage}</p>
                              <p className="text-sm text-stone-600">Frequency: {med.frequency}</p>
                              <p className="text-sm text-stone-600">Duration: {med.duration}</p>
                              {med.instructions && (
                                <p className="text-sm text-stone-600">Instructions: {med.instructions}</p>
                              )}
                            </div>
                          ))
                        : viewedPrescription.medicationsJson?.map((med, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                              <p className="font-bold text-stone-800">{med.name} - {med.dosage}</p>
                              <p className="text-sm text-stone-600">Frequency: {med.frequency}</p>
                              <p className="text-sm text-stone-600">Duration: {med.duration}</p>
                              {med.instructions && (
                                <p className="text-sm text-stone-600">Instructions: {med.instructions}</p>
                              )}
                            </div>
                          ))
                      }
                    </div>
                  </div>
                )}

                {/* Prescription Text */}
                {viewedPrescription.prescriptionText && (
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4">Full Prescription</h3>
                    <p className="whitespace-pre-wrap font-mono text-sm text-stone-700">
                      {viewedPrescription.prescriptionText}
                    </p>
                  </div>
                )}

                {/* Special Instructions */}
                {viewedPrescription.specialInstructions && (
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200">
                    <h3 className="text-lg font-bold text-orange-900 mb-4">Special Instructions</h3>
                    <p className="text-stone-700">{viewedPrescription.specialInstructions}</p>
                  </div>
                )}

                {/* Notes */}
                {viewedPrescription.notes && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border-2 border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Notes</h3>
                    <p className="text-stone-700">{viewedPrescription.notes}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-stone-50 to-stone-100 px-8 py-5 border-t-2 border-stone-200 flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowViewPrescriptionModal(false)}
                  className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prescription Print Modal */}
      <AnimatePresence>
        {showPrescriptionPrintModal && prescriptionToPrint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            onClick={() => setShowPrescriptionPrintModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-stone-900 to-stone-800 px-8 py-6 sticky top-0 z-10 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>🖨️</span> Print Prescription
                </h2>
                <button
                  onClick={() => setShowPrescriptionPrintModal(false)}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Prescription Preview */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-140px)]">
                <PrescriptionPrint
                  ref={printRef}
                  prescription={prescriptionToPrint}
                  patientInfo={selectedAppointmentDetails}
                  doctorInfo={{
                    doctorName: JSON.parse(localStorage.getItem("userData") || "{}").username || "Doctor",
                    registrationNumber: JSON.parse(localStorage.getItem("userData") || "{}").registrationNumber || ""
                  }}
                  clinicInfo={SAMPLE_CLINIC_DETAILS}
                />
              </div>

              {/* Footer */}
              <div className="bg-stone-100 px-8 py-5 flex justify-end gap-3 border-t border-stone-200 sticky bottom-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPrescriptionPrintModal(false)}
                  className="px-6 py-2.5 text-stone-700 hover:text-stone-900 font-semibold transition-colors"
                >
                  Close
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => window.print()}
                  className="px-8 py-2.5 bg-gradient-to-r from-stone-900 to-stone-800 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>🖨️</span>
                  <span>Print Now</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Edit Appointment Modal */}
      <FullEditAppointmentModal />

      {/* View Prescription Modal */}
      <ViewPrescriptionModal />

      {/* Diagnosis Save Success Modal */}
      <AnimatePresence>
        {showDiagnosisSaveSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="text-6xl mb-4 mx-auto w-fit"
              >
                ✨
              </motion.div>
              <h3 className="text-2xl font-bold text-green-600 mb-3">Success!</h3>
              <p className="text-lg text-stone-700 mb-6">{diagnosisSaveMessage}</p>
              <div className="w-full bg-gradient-to-r from-green-600 to-emerald-600 h-1 rounded-full mb-6"></div>
              <p className="text-sm text-stone-500">Closing in a moment...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medicine Save Success Modal */}
      <AnimatePresence>
        {showMedicineSaveSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4"
            onClick={() => setShowMedicineSaveSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
                className="text-6xl mb-4 mx-auto w-fit"
              >
                💊
              </motion.div>
              <h3 className="text-2xl font-bold text-purple-600 mb-3">Awesome!</h3>
              <p className="text-lg text-stone-700 mb-6">{medicineSaveMessage}</p>
              <div className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 h-1 rounded-full mb-6"></div>
              <button
                onClick={() => setShowMedicineSaveSuccess(false)}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
              >
                Got it!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prescription Preview & Print Modal */}
      <AnimatePresence>
        {showPrescriptionPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[10002] p-4"
            onClick={() => setShowPrescriptionPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6 flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>📋</span> Prescription Preview
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-semibold transition-all flex items-center gap-2"
                  >
                    <span>🖨️</span> Print
                  </button>
                  <button
                    onClick={() => setShowPrescriptionPreview(false)}
                    className="w-10 h-10 bg-white/20 hover:bg-white/30 text-white rounded-full flex items-center justify-center transition-all"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Prescription Content */}
              <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                <div className="bg-white rounded-xl shadow-lg p-8 max-w-3xl mx-auto">
                  {/* Clinic Header */}
                  <div className="border-b-4 border-indigo-600 pb-6 mb-6">
                    <h1 className="text-3xl font-bold text-indigo-900 mb-2">
                      {JSON.parse(localStorage.getItem("selectedAccess") || "{}").clinicName || "Dentaesthetics Clinic"}
                    </h1>
                    <p className="text-stone-600">Contact: +91 98765 43210 | Email: clinic@dentaesthetics.com</p>
                  </div>

                  {/* Doctor & Patient Info */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                    <div>
                      <h3 className="font-bold text-indigo-900 mb-2 text-lg">Doctor Information</h3>
                      <p className="text-stone-700"><strong>Name:</strong> {JSON.parse(localStorage.getItem("userData") || "{}").username || "Doctor"}</p>
                      <p className="text-stone-700"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <h3 className="font-bold text-indigo-900 mb-2 text-lg">Patient Information</h3>
                      <p className="text-stone-700"><strong>Name:</strong> {selectedAppointmentForVisit?.patientName || "Patient"}</p>
                      <p className="text-stone-700"><strong>Age:</strong> {selectedAppointmentForVisit?.patientAge || "N/A"}</p>
                      <p className="text-stone-700"><strong>Phone:</strong> {selectedAppointmentForVisit?.patientPhone || "N/A"}</p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  {visitForm.diagnosis && (
                    <div className="mb-6 bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                      <h3 className="font-bold text-amber-900 mb-2">Diagnosis</h3>
                      <p className="text-stone-700">{visitForm.diagnosis}</p>
                    </div>
                  )}

                  {/* Medications */}
                  <div className="mb-6">
                    <h3 className="font-bold text-indigo-900 mb-4 text-xl flex items-center gap-2 border-b-2 border-indigo-200 pb-2">
                      <span>💊</span> Prescribed Medications
                    </h3>
                    <div className="space-y-4">
                      {inlineMedications.map((med, index) => (
                        <div key={index} className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-r-lg">
                          <h4 className="font-bold text-lg text-stone-900 mb-2">{index + 1}. {med.name}</h4>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-semibold text-purple-900">Dosage:</span>
                              <p className="text-stone-700">{med.dosage}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-purple-900">Frequency:</span>
                              <p className="text-stone-700">{med.frequency}</p>
                            </div>
                            <div>
                              <span className="font-semibold text-purple-900">Duration:</span>
                              <p className="text-stone-700">{med.duration}</p>
                            </div>
                          </div>
                          {med.instructions && (
                            <div className="mt-2">
                              <span className="font-semibold text-purple-900">Instructions:</span>
                              <p className="text-stone-700">{med.instructions}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {visitForm.notes && (
                    <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                      <h3 className="font-bold text-blue-900 mb-2">Additional Notes</h3>
                      <p className="text-stone-700">{visitForm.notes}</p>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="border-t-2 border-gray-300 pt-6 mt-8">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-stone-600">Follow-up: {visitForm.followUpDate || "As needed"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-stone-900 mb-1">Doctor's Signature</p>
                        <div className="border-b-2 border-stone-400 w-48 mb-2"></div>
                        <p className="text-sm text-stone-600">{JSON.parse(localStorage.getItem("userData") || "{}").username || "Doctor"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-gray-100 px-8 py-4 flex items-center justify-between border-t">
                <p className="text-sm text-stone-600">{inlineMedications.length} medication(s) prescribed</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPrescriptionPreview(false)}
                    className="px-6 py-2 bg-stone-300 hover:bg-stone-400 text-stone-800 rounded-lg font-semibold transition-all"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <span>🖨️</span> Print
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Prescription Modal */}
      <AnimatePresence>
        {printPrescriptionData && (
          <>
            {/* Print Styles - Only visible during printing */}
            <style>
              {`
                @media print {
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                  }
                  
                  html, body {
                    width: 100%;
                    height: 100%;
                  }
                  
                  body {
                    display: block;
                  }
                  
                  body > * {
                    display: none !important;
                  }
                  
                  #printable-prescription {
                    display: block !important;
                    visibility: visible !important;
                    position: static;
                    width: 100%;
                    height: 100%;
                    background: white;
                    margin: 0;
                    padding: 20mm;
                    border: none;
                    box-shadow: none;
                    overflow: visible;
                  }
                  
                  #printable-prescription * {
                    visibility: visible !important;
                    display: block;
                  }
                  
                  @page {
                    margin: 15mm;
                    size: A4;
                  }
                }
              `}
            </style>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10000] p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 30 }}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              >
                {/* Modal Header - Hidden in print */}
                <div className="print:hidden sticky top-0 bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-6 flex items-center justify-between z-50">
                  <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>🖨️</span> Prescription Preview
                  </h3>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setPrintPrescriptionData(null)}
                    className="w-10 h-10 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition"
                  >
                    ✕
                  </motion.button>
                </div>

                {/* Printable Content */}
                <div id="printable-prescription" className="p-8 bg-white">
                  {/* Clinic Header */}
                  <div className="text-center border-b-2 border-blue-600 pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-blue-900 mb-1">DENTAESTHETICS</h1>
                    <p className="text-sm text-gray-600">Mumbai Central | Shop 12, Andheri West</p>
                    <p className="text-xs text-gray-500">Ph: +91 98765 43210</p>
                  </div>

                  {/* Patient & Date Info */}
                  <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>Patient Name:</strong> {printPrescriptionData.patientName || 'N/A'}</p>
                      <p><strong>Age:</strong> {printPrescriptionData.patientAge || 'N/A'}</p>
                    </div>
                    <div className="text-right">
                      <p><strong>Date:</strong> {new Date().toLocaleDateString('en-IN')}</p>
                      <p><strong>Dr.</strong> {printPrescriptionData.doctorName || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Diagnosis */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">DIAGNOSIS</h3>
                    <p className="text-sm">{printPrescriptionData.diagnosis || 'N/A'}</p>
                  </div>

                  {/* Medications */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3 border-b border-gray-300 pb-1">℞ PRESCRIPTION</h3>
                    <div className="space-y-3">
                      {printPrescriptionData.medications && printPrescriptionData.medications.length > 0 ? (
                        printPrescriptionData.medications.map((med, idx) => (
                          <div key={idx} className="border-l-2 border-blue-500 pl-3 py-1">
                            <p className="font-semibold text-sm">{idx + 1}. {med.name || med.medicineName}</p>
                            <p className="text-xs text-gray-600 ml-4">
                              {med.dosage} - {med.frequency} - {med.duration}
                            </p>
                            {med.instructions && (
                              <p className="text-xs text-gray-500 ml-4 italic">{med.instructions}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No medications prescribed</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {printPrescriptionData.notes && (
                    <div className="mb-6">
                      <h3 className="text-sm font-bold text-gray-700 mb-2 border-b border-gray-300 pb-1">NOTES</h3>
                      <p className="text-xs text-gray-600">{printPrescriptionData.notes}</p>
                    </div>
                  )}

                  {/* Signature */}
                  <div className="mt-12 pt-4 border-t border-gray-300 flex justify-between items-end">
                    <div className="text-xs text-gray-500">
                      <p>Generated: {new Date().toLocaleString('en-IN')}</p>
                    </div>
                    <div className="text-center">
                      <div className="h-8 mb-1"></div>
                      <p className="text-xs border-t border-gray-400 pt-1">Doctor's Signature</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons - Hidden in print */}
                <div className="print:hidden bg-gray-100 px-8 py-4 flex justify-end gap-3 border-t">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setPrintPrescriptionData(null)}
                    className="px-6 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Close
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => window.print()}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
                  >
                    <span>🖨️</span>
                    <span>Print Now</span>
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Prescription Success Modal */}
      <PrescriptionSuccessModal />

      {/* Add New Medicine Modal - Compact & Quick */}
      <AnimatePresence>
        {showAddMedicineModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001] p-4"
            onClick={() => setShowAddMedicineModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-2xl font-bold text-purple-900 flex items-center gap-2">
                  <span>💊</span> Quick Add Medicine
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddMedicineModal(false)}
                  className="w-8 h-8 bg-gray-200 hover:bg-red-500 hover:text-white text-gray-700 rounded-full flex items-center justify-center transition-all"
                >
                  ✕
                </motion.button>
              </div>

              <div className="bg-purple-50 border-l-4 border-purple-500 rounded-lg p-3 mb-5">
                <p className="text-sm text-purple-900 flex items-center gap-2">
                  <span>💡</span>
                  <span>After adding, this medicine will be automatically selected in your prescription form</span>
                </p>
              </div>

              <div className="space-y-4">
                {/* Medicine Name */}
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">
                    Medicine Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newMedicineForm.itemName}
                    onChange={(e) => setNewMedicineForm(prev => ({ ...prev, itemName: e.target.value }))}
                    placeholder="e.g., Paracetamol, Amoxicillin"
                    className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                    autoFocus
                  />
                </div>

                {/* Medicine Code */}
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">
                    Medicine Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newMedicineForm.itemCode}
                    onChange={(e) => setNewMedicineForm(prev => ({ ...prev, itemCode: e.target.value }))}
                    placeholder="e.g., PARA001, AMOX002"
                    className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newMedicineForm.category}
                      onChange={(e) => setNewMedicineForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                    >
                      <option value="Medicines">Medicines</option>
                      <option value="Consumables">Consumables</option>
                      <option value="Equipment">Equipment</option>
                      <option value="Supplements">Supplements</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">
                      Unit
                    </label>
                    <select
                      value={newMedicineForm.unit}
                      onChange={(e) => setNewMedicineForm(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                    >
                      <option value="tablet">Tablet</option>
                      <option value="capsule">Capsule</option>
                      <option value="ml">ML (Liquid)</option>
                      <option value="injection">Injection</option>
                      <option value="powder">Powder</option>
                      <option value="ointment">Ointment</option>
                      <option value="syrup">Syrup</option>
                      <option value="drops">Drops</option>
                    </select>
                  </div>
                </div>

                {/* Sub Category */}
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-2">
                    Sub Category
                  </label>
                  <input
                    type="text"
                    value={newMedicineForm.subCategory}
                    onChange={(e) => setNewMedicineForm(prev => ({ ...prev, subCategory: e.target.value }))}
                    placeholder="e.g., Antibiotic, Analgesic, Pain Relief"
                    className="w-full px-4 py-2.5 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddMedicineModal(false)}
                  className="flex-1 px-5 py-2.5 bg-gray-200 text-gray-800 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddNewMedicine}
                  disabled={!newMedicineForm.itemName || !newMedicineForm.itemCode}
                  className={`flex-1 px-5 py-2.5 rounded-lg font-bold shadow-lg transition flex items-center justify-center gap-2 ${
                    !newMedicineForm.itemName || !newMedicineForm.itemCode
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-xl'
                  }`}
                >
                  <span>➕</span>
                  <span>Add to Inventory</span>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <SuccessModal />
    </div>
  );
}
