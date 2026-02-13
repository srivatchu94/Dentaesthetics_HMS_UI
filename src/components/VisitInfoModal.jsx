import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addPatientVisit } from "../services/appointmentService";
import { editPatientVisit } from "../services/patientService";
import { sendPrescriptionEmail } from "../services/emailService";

// Extracted and properly memoized VisitInfoModal Component
const VisitInfoModal = ({
  show,
  onClose,
  selectedAppointment,
  onVisitSaved,
  loadInventoryMedications,
  inventoryMeds,
  loadingMeds,
  handleOpenAddMedicineModal,
  handleRemoveMedication,
  prescriptionId,
  getPrescriptionById,
  sendingEmail,
  setSendingEmail,
  setSuccessMessage,
  setShowPrescriptionSuccessModal,
  chronicDiseases = [],
  allergies = [],
  diagnosis = '',
  treatment = '',
  medications = '',
  notes = '',
  reasonForVisit = '',
  loadingMedicalInfo = false,
  medicalInfoError = false
}) => {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔴 VisitInfoModal FUNCTION CALLED WITH NEW PROPS');
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔥 VisitInfoModal RENDERED - Props received:', {
    show,
    diagnosis: diagnosis ? `"${diagnosis}"` : '(empty)',
    treatment: treatment ? `"${treatment}"` : '(empty)',
    medications: medications ? `"${medications}"` : '(empty)',
    notes: notes ? `"${notes}"` : '(empty)',
    loadingMedicalInfo,
    medicalInfoError
  });
  
  if (!show || !selectedAppointment) return null;

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
  const [viewedPrescription, setViewedPrescription] = useState(null);
  const [showViewPrescriptionModal, setShowViewPrescriptionModal] = useState(false);
  const [printPrescriptionData, setPrintPrescriptionData] = useState(null);
  
  const localMedicineInputRef = useRef(null);
  const loadedAppointmentRef = useRef(null);

  // Simplify variable names
  const currentMedication = localCurrentMedication;
  const setCurrentMedication = setLocalCurrentMedication;
  const inlineMedications = localInlineMedications;
  const setInlineMedications = setLocalInlineMedications;
  const editingMedicationIndex = localEditingMedicationIndex;
  const setEditingMedicationIndex = setLocalEditingMedicationIndex;
  const medicineDropdownOpen = localMedicineDropdownOpen;
  const setMedicineDropdownOpen = setLocalMedicineDropdownOpen;
  const medicineInputRef = localMedicineInputRef;

  // Initialize form state with new data when modal opens
  useEffect(() => {
    if (show && selectedAppointment) {
      console.log('═══════════════════════════════════════════════════════');
      console.log('📂 VisitInfoModal OPENED');
      console.log('═══════════════════════════════════════════════════════');
      console.log('Props Received:');
      console.log('  diagnosis:', diagnosis ? `"${diagnosis}"` : '(empty)');
      console.log('  treatment:', treatment ? `"${treatment}"` : '(empty)');
      console.log('  medications:', medications ? `"${medications}"` : '(empty)');
      console.log('  notes:', notes ? `"${notes}"` : '(empty)');
      console.log('  chronicDiseases:', chronicDiseases);
      console.log('  allergies:', allergies);
      console.log('Loading States:');
      console.log('  loadingMedicalInfo:', loadingMedicalInfo);
      console.log('  medicalInfoError:', medicalInfoError);
      console.log('═══════════════════════════════════════════════════════');
    }
  }, [show, diagnosis, treatment, medications, notes, reasonForVisit, chronicDiseases, allergies, selectedAppointment, loadingMedicalInfo, medicalInfoError]);
  
  // Track every prop change
  useEffect(() => {
    console.log('🔄 PROP CHANGED (diagnosis):', diagnosis ? `"${diagnosis}"` : '(empty)');
  }, [diagnosis]);
  
  useEffect(() => {
    console.log('🔄 PROP CHANGED (treatment):', treatment ? `"${treatment}"` : '(empty)');
  }, [treatment]);
  
  useEffect(() => {
    console.log('🔄 PROP CHANGED (medications):', medications ? `"${medications}"` : '(empty)');
  }, [medications]);
  
  useEffect(() => {
    console.log('🔄 PROP CHANGED (notes):', notes ? `"${notes}"` : '(empty)');
  }, [notes]);

  // Reset form when modal opens or appointment changes
  useEffect(() => {
    if (show && selectedAppointment?.appointmentId) {
      console.log('🔄 RESET FORM - Modal opened or appointment changed:', selectedAppointment.appointmentId);
      setVisitForm({
        visitDate: new Date().toISOString().split('T')[0],
        chiefComplaint: '',
        diagnosis: '',
        treatmentProvided: '',
        prescriptions: '',
        followUpDate: '',
        notes: ''
      });
      setLocalInlineMedications([]);
      // Clear the ref to allow existing visit data check to run again
      loadedAppointmentRef.current = null;
    }
  }, [show, selectedAppointment?.appointmentId]);

  // Load existing visit data - ONLY ONCE per appointment
  useEffect(() => {
    const appointmentId = selectedAppointment?.appointmentId;
    
    if (loadedAppointmentRef.current === appointmentId) {
      return;
    }
    
    if (!appointmentId || !selectedAppointment?.existingVisitData) {
      console.log('📝 No existing data, initializing empty form');
      setIsExistingVisit(false);
      return;
    }

    loadedAppointmentRef.current = appointmentId;
    const existingData = selectedAppointment.existingVisitData;
    console.log('📥 Loading existing visit data - Appointment:', appointmentId);
    
    const hasExistingData = existingData.visitDate || existingData.diagnosis || existingData.reasonForVisit;
    if (hasExistingData) {
      setIsExistingVisit(true);
    }
    
    setVisitForm({
      visitDate: existingData.visitDate ? existingData.visitDate.split('T')[0] : new Date().toISOString().split('T')[0],
      chiefComplaint: existingData.chiefComplaint || existingData.reasonForVisit || '',
      diagnosis: existingData.diagnosis || existingData.diagnoses || '',
      treatmentProvided: existingData.treatmentProvided || existingData.treatments || '',
      prescriptions: existingData.prescriptions || '',
      followUpDate: existingData.followUpDate ? existingData.followUpDate.split('T')[0] : '',
      notes: existingData.notes || ''
    });
    
    if (existingData.prescriptions && Array.isArray(existingData.prescriptions)) {
      setLocalInlineMedications(existingData.prescriptions.map(med => ({
        name: med.medicineName || med.name || '',
        dosage: med.dosage || '',
        frequency: med.frequency || '',
        duration: med.duration || '',
        instructions: med.instructions || ''
      })));
    }
  }, [selectedAppointment?.appointmentId, show]);

  // Track visitForm state changes
  useEffect(() => {
    console.log('📝 VISITFORM STATE UPDATED:', {
      diagnosis: visitForm.diagnosis ? visitForm.diagnosis.substring(0, 50) + '...' : '(empty)',
      treatmentProvided: visitForm.treatmentProvided ? visitForm.treatmentProvided.substring(0, 50) + '...' : '(empty)',
      notes: visitForm.notes ? visitForm.notes.substring(0, 50) + '...' : '(empty)'
    });
  }, [visitForm.diagnosis, visitForm.treatmentProvided, visitForm.notes]);

  // Specific effect: when loading completes, fill the form
  useEffect(() => {
    if (show && !loadingMedicalInfo && medicalInfoError === false) {
      console.log('✅ LOADING COMPLETE! Medical info available. Triggering auto-fill.');
      console.log('   diagnosis prop value:', diagnosis ? `"${diagnosis}"` : '(empty)');
      console.log('   treatment prop value:', treatment ? `"${treatment}"` : '(empty)');
      console.log('   medications prop value:', medications ? `"${medications}"` : '(empty)');
      console.log('   notes prop value:', notes ? `"${notes}"` : '(empty)');
      console.log('   reasonForVisit prop value:', reasonForVisit ? `"${reasonForVisit}"` : '(empty)');
      
      // Force fill all fields when loading completes
      if (diagnosis || treatment || notes || reasonForVisit) {
        console.log('📋 DATA DETECTED - FILLING FORM NOW');
        setVisitForm(prev => {
          const updated = { ...prev };
          let changed = false;
          
          if (reasonForVisit && updated.chiefComplaint === '') {
            console.log('   ✅ Setting chiefComplaint:', reasonForVisit);
            updated.chiefComplaint = reasonForVisit;
            changed = true;
          }
          
          if (diagnosis && updated.diagnosis === '') {
            console.log('   ✅ Setting diagnosis:', diagnosis);
            updated.diagnosis = diagnosis;
            changed = true;
          }
          
          if (treatment && updated.treatmentProvided === '') {
            console.log('   ✅ Setting treatmentProvided:', treatment);
            updated.treatmentProvided = treatment;
            changed = true;
          }
          
          if (notes && updated.notes === '') {
            console.log('   ✅ Setting notes:', notes);
            updated.notes = notes;
            changed = true;
          }
          
          if (changed) {
            console.log('   📤 Form state updated:', { diagnosis: updated.diagnosis, treatment: updated.treatmentProvided, notes: updated.notes });
          }
          
          return updated;
        });
      } else {
        console.log('⚠️ NO DATA TO FILL FORM - All props are empty');
      }
      
      // Handle medications
      if (medications && inlineMedications.length === 0) {
        console.log('   → Processing medications on load complete:', medications);
        const medArray = medications
          .split(',')
          .map(med => {
            const parts = med.trim().split('-');
            return {
              name: parts[0]?.trim() || '',
              dosage: parts[1]?.trim() || '',
              frequency: parts[2]?.trim() || 'As needed',
              duration: parts[3]?.trim() || '7 days',
              instructions: parts[4]?.trim() || ''
            };
          })
          .filter(med => med.name);
        
        if (medArray.length > 0) {
          console.log('   ✅ Adding medications to form:', medArray);
          setLocalInlineMedications(medArray);
        }
      }
    }
  }, [show, loadingMedicalInfo, medicalInfoError, diagnosis, treatment, medications, notes, reasonForVisit, inlineMedications.length]);

  // Separate effect to forcefully fill form when medical data props arrive
  useEffect(() => {
    if (show && reasonForVisit && visitForm.chiefComplaint === '') {
      console.log('💥 FORCE FILL: ReasonForVisit detected, forcing form update');
      setVisitForm(prev => ({
        ...prev,
        chiefComplaint: reasonForVisit
      }));
    }
  }, [reasonForVisit, show]);

  useEffect(() => {
    if (show && diagnosis && visitForm.diagnosis === '') {
      console.log('💥 FORCE FILL: Diagnosis detected, forcing form update');
      setVisitForm(prev => ({
        ...prev,
        diagnosis: diagnosis
      }));
    }
  }, [diagnosis, show]);

  useEffect(() => {
    if (show && treatment && visitForm.treatmentProvided === '') {
      console.log('💥 FORCE FILL: Treatment detected, forcing form update');
      setVisitForm(prev => ({
        ...prev,
        treatmentProvided: treatment
      }));
    }
  }, [treatment, show]);

  useEffect(() => {
    if (show && notes && visitForm.notes === '') {
      console.log('💥 FORCE FILL: Notes detected, forcing form update');
      setVisitForm(prev => ({
        ...prev,
        notes: notes
      }));
    }
  }, [notes, show]);

  // Medications separate effect
  useEffect(() => {
    if (show && medications && inlineMedications.length === 0 && typeof medications === 'string' && medications.trim()) {
      console.log('💥 FORCE FILL: Medications detected, parsing and forking form update');
      const medArray = medications
        .split(',')
        .map(med => {
          const parts = med.trim().split('-');
          return {
            name: parts[0]?.trim() || '',
            dosage: parts[1]?.trim() || '',
            frequency: parts[2]?.trim() || 'As needed',
            duration: parts[3]?.trim() || '7 days',
            instructions: parts[4]?.trim() || ''
          };
        })
        .filter(med => med.name);
      
      if (medArray.length > 0) {
        console.log('💥 FORCE FILL: Setting medications array:', medArray);
        setLocalInlineMedications(medArray);
      }
    }
  }, [medications, show, inlineMedications.length]);

  // Separate effect just to track when critical props change
  useEffect(() => {
    console.log('⚡ CRITICAL PROPS CHANGED - New values available');
    console.log('   diagnosis:', diagnosis ? `"${diagnosis}"` : '(empty)');
    console.log('   treatment:', treatment ? `"${treatment}"` : '(empty)');
    console.log('   notes:', notes ? `"${notes}"` : '(empty)');
    console.log('   loadingMedicalInfo:', loadingMedicalInfo);
  }, [diagnosis, treatment, notes, loadingMedicalInfo]);

  // Auto-fill form with medical info when available - fills empty fields with API data
  useEffect(() => {
    console.log('🔍 Auto-fill Effect Running:');
    console.log('   show:', show);
    console.log('   loadingMedicalInfo:', loadingMedicalInfo);
    console.log('   medicalInfoError:', medicalInfoError);
    console.log('   diagnosis prop:', diagnosis);
    console.log('   treatment prop:', treatment);
    console.log('   medications prop:', medications);
    console.log('   notes prop:', notes);
    
    // If modal is open and loading is done
    if (show && !loadingMedicalInfo && !medicalInfoError) {
      // Check if we have data to fill
      const hasDataToFill = diagnosis || treatment || medications || notes;
      console.log('   hasDataToFill:', hasDataToFill);
      
      if (hasDataToFill) {
        console.log('📋 TRIGGER: AUTO-FILLING FORM WITH API DATA');
        
        // Fill form with API data - ALWAYS update if new data differs from current form data
        setVisitForm(prev => {
          const updated = { ...prev };
          let anyChanges = false;
          
          // Update diagnosis if API data differs from current form data
          if (diagnosis && prev.diagnosis !== diagnosis) {
            console.log('   ✅ Updating diagnosis:', prev.diagnosis || '(empty)', '→', diagnosis);
            updated.diagnosis = diagnosis;
            anyChanges = true;
          } else if (!diagnosis && prev.diagnosis) {
            console.log('   ℹ️ No diagnosis in API, keeping existing:', prev.diagnosis);
          }
          
          // Update treatment if API data differs from current form data 
          if (treatment && prev.treatmentProvided !== treatment) {
            console.log('   ✅ Updating treatmentProvided:', prev.treatmentProvided || '(empty)', '→', treatment);
            updated.treatmentProvided = treatment;
            anyChanges = true;
          } else if (!treatment && prev.treatmentProvided) {
            console.log('   ℹ️ No treatment in API, keeping existing:', prev.treatmentProvided);
          }
          
          // Update notes if API data differs from current form data
          if (notes && prev.notes !== notes) {
            console.log('   ✅ Updating notes:', prev.notes || '(empty)', '→', notes);
            updated.notes = notes;
            anyChanges = true;
          } else if (!notes && prev.notes) {
            console.log('   ℹ️ No notes in API, keeping existing:', prev.notes);
          }
          
          if (anyChanges) {
            console.log('   📤 Updated visitForm state:', { diagnosis: updated.diagnosis, treatmentProvided: updated.treatmentProvided, notes: updated.notes });
          } else {
            console.log('   ℹ️ No changes needed, form already has data');
          }
          
          return updated;
        });
        
        // Handle medications - add to existing medications array
        if (medications && typeof medications === 'string' && medications.trim()) {
          console.log('   → Processing medications string:', medications);
          const medArray = medications
            .split(',')
            .map(med => {
              const parts = med.trim().split('-');
              return {
                name: parts[0]?.trim() || '',
                dosage: parts[1]?.trim() || '',
                frequency: parts[2]?.trim() || 'As needed',
                duration: parts[3]?.trim() || '7 days',
                instructions: parts[4]?.trim() || ''
              };
            })
            .filter(med => med.name);
          
          if (medArray.length > 0) {
            console.log('   ✅ Adding medications array:', medArray);
            setLocalInlineMedications(medArray);
          } else {
            console.log('   ⚠️ No valid medications after parsing');
          }
        }
      } else {
        console.log('⚠️ NO DATA TO FILL FORM - All props are empty');
      }
    }
  }, [show, diagnosis, treatment, medications, notes, loadingMedicalInfo, medicalInfoError]);

  useEffect(() => {
    if (!show) {
      loadedAppointmentRef.current = null;
    }
  }, [show]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (medicineInputRef.current && !medicineInputRef.current.contains(event.target)) {
        setMedicineDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const chronicDiseaseList = Array.isArray(chronicDiseases) ? chronicDiseases : [];
  const allergyList = Array.isArray(allergies) ? allergies : [];

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

  const handlePrintPrescription = () => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    setPrintPrescriptionData({
      patientName: `${selectedAppointment.firstName} ${selectedAppointment.lastName}`,
      patientId: selectedAppointment.patientId,
      patientAge: selectedAppointment.age || 'N/A',
      doctorName: selectedAppointment.doctorName || userData.username || 'Doctor',
      registrationNumber: selectedAppointment.registrationNumber || 'N/A',
      diagnosis: visitForm.diagnosis,
      medications: inlineMedications,
      notes: visitForm.notes
    });
  };

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
      const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      
      if (!selectedAccess || !selectedAccess.enterpriseId || !selectedAccess.clinicId) {
        console.error('❌ selectedAccess is invalid!');
        alert('❌ Session error: Please logout and login again to select your enterprise/clinic.');
        setSavingVisit(false);
        return;
      }

      const prescriptions = inlineMedications.map(med => ({
        MedicineName: med.name,
        Dosage: med.dosage,
        Frequency: med.frequency,
        Duration: med.duration,
        SpecialInstructions: med.instructions || '',
        GeneralPrescriptionNotes: ''
      }));

      const visitData = {
        AppointmentId: parseInt(selectedAppointment.appointmentId || 0),
        PatientId: parseInt(selectedAppointment.patientId || 0),
        ClinicId: parseInt(selectedAccess.clinicId || selectedAppointment.clinicId || 0),
        VisitDate: visitForm.visitDate,
        ReasonForVisit: visitForm.chiefComplaint,
        Diagnoses: visitForm.diagnosis,
        Treatments: visitForm.treatmentProvided,
        Notes: visitForm.notes || '',
        NextAppointmentDate: visitForm.followUpDate || null,
        AttendingPhysician: selectedAppointment.doctorName || userData.username || 'Doctor',
        BillingAmount: Number(selectedAppointment.billableAmount) || 0,
        PaymentStatus: selectedAppointment.paymentStatus || 'Pending',
        CreatedBy: userData.username || userData.fullName || 'Doctor',
        UpdatedBy: userData.username || userData.fullName || 'Doctor',
        Prescriptions: prescriptions
      };

      let response;
      if (isExistingVisit) {
        console.log('🔄 UPDATING EXISTING VISIT');
        response = await editPatientVisit(visitData);
      } else {
        console.log('✨ CREATING NEW VISIT');
        response = await addPatientVisit(visitData);
      }
      
      const funnyMessages = [
        "🎉 Diagnosis saved! Another satisfied patient incoming!",
        "💊 Boom! Visit documented with surgical precision!",
        "✅ Perfect! Your diagnosis is now immortalized in the system!",
        "🏥 Success! You've just made medical history!",
        "📋 Done! Your visit report is safe and sound!",
        "💉 Nailed it! The prescription gods smile upon you!",
        "🎯 Visit saved! You're officially awesome today!",
        "🚀 Warp speed success! Your diagnosis has entered orbit!",
        "🏆 Champion! Your patient care game is strong!",
        "⭐ Star quality diagnosis! Standing ovation from the germs!"
      ];
      
      const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      console.log('✅ Visit saved successfully:', response);
      
      // Show success message
      setSuccessMessage(randomMessage);
      setShowPrescriptionSuccessModal(true);
      
      setTimeout(() => {
        onClose();
        onVisitSaved();
        setVisitForm({
          visitDate: new Date().toISOString().split('T')[0],
          followUpDate: '',
          chiefComplaint: '',
          diagnosis: '',
          treatmentProvided: '',
          notes: '',
          prescriptions: ''
        });
        setLocalInlineMedications([]);
      }, 2000);
    } catch (error) {
      console.error('Failed to save visit:', error);
      alert('❌ Failed to save visit information. Please try again.');
    } finally {
      setSavingVisit(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6 rounded-t-3xl flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl shadow-lg">
              🩺
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white">Diagnosis & Patient Visit</h2>
              <p className="text-teal-100 text-sm mt-1">
                {selectedAppointment.firstName} {selectedAppointment.lastName} • ID: #{selectedAppointment.patientId}
              </p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="flex-shrink-0 w-12 h-12 bg-white/20 hover:bg-red-500/30 text-white rounded-full flex items-center justify-center transition-all duration-300 border-2 border-white/40"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.button>
        </div>

        {/* Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT COLUMN */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-1 space-y-4"
            >
              {/* Patient Card */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-md h-fit">
                <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                  <span>👤</span> Patient Info
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3 pb-3 border-b border-blue-100">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                      {selectedAppointment.firstName?.charAt(0)}{selectedAppointment.lastName?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-stone-600 font-medium">Name</p>
                      <p className="font-bold text-stone-800">{selectedAppointment.firstName} {selectedAppointment.lastName}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-600">Phone:</span>
                      <span className="font-bold text-stone-800">{selectedAppointment.phoneNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-600">Email:</span>
                      <span className="font-bold text-stone-800 truncate max-w-[140px]">{selectedAppointment.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chronic Diseases */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-md h-fit">
                <h3 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
                  <span>⚠️</span> Chronic Diseases
                </h3>
                <div className="space-y-2">
                  {loadingMedicalInfo ? (
                    <div className="text-sm text-stone-600 animate-pulse">⏳ Checking medical history...</div>
                  ) : medicalInfoError ? (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">ℹ️ Medical history unavailable - backend error</div>
                  ) : chronicDiseaseList.length === 0 ? (
                    <div className="text-sm text-stone-500">No chronic diseases recorded.</div>
                  ) : (
                    chronicDiseaseList.map((disease, idx) => (
                      <motion.div
                        key={`${disease}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-lg p-3 border-l-4 border-red-400 shadow-sm"
                      >
                        <p className="text-sm font-semibold text-stone-800">✓ {disease}</p>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>

              {/* Allergies */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200 shadow-md h-fit">
                <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                  <span>🚨</span> Allergies
                </h3>
                <div className="space-y-2">
                  {loadingMedicalInfo ? (
                    <div className="text-sm text-stone-600 animate-pulse">⏳ Checking allergy data...</div>
                  ) : medicalInfoError ? (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">ℹ️ Allergy data unavailable - backend error</div>
                  ) : allergyList.length === 0 ? (
                    <div className="text-sm text-stone-500">No allergies recorded.</div>
                  ) : (
                    allergyList.map((allergy, idx) => (
                      <motion.div
                        key={`${allergy}-${idx}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="bg-white rounded-lg p-3 border-l-4 border-orange-400 shadow-sm"
                      >
                        <p className="text-sm font-semibold text-stone-800">⚠️ {allergy}</p>
                      </motion.div>
                    ))
                  )}
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
                    <span className="font-bold text-stone-800">{new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-600">Time:</span>
                    <span className="font-bold text-stone-800">{selectedAppointment.startTime || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-violet-100">
                    <span className="text-stone-600">Type:</span>
                    <span className="font-bold text-stone-800">{selectedAppointment.appointmentType || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* CENTER & RIGHT COLUMNS - FORM */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2 space-y-5"
            >
              {/* Visit Dates */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-md">
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
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Follow-up Date</label>
                    <input
                      type="date"
                      value={visitForm.followUpDate}
                      onChange={(e) => handleVisitFormChange('followUpDate', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
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
                  value={visitForm.chiefComplaint}
                  onChange={(e) => handleVisitFormChange('chiefComplaint', e.target.value)}
                  placeholder="What is the main reason for the visit?"
                  rows={2}
                  className="w-full px-4 py-2 border-2 border-pink-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition resize-none"
                />
              </div>

              {/* Diagnosis */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-md ring-2 ring-indigo-100">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                    <span>🔬</span> Diagnosis <span className="text-red-500">*</span>
                  </h3>
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

                {/* Medication Input Form */}
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
                            const newValue = e.target.value;
                            setCurrentMedication(prev => ({ ...prev, name: newValue }));
                            if (!medicineDropdownOpen) {
                              setMedicineDropdownOpen(true);
                            }
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
                                <div className="sticky bottom-0 bg-gradient-to-r from-slate-100 to-purple-100 p-3 border-t border-purple-200">
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
                      <label className="block text-sm font-bold text-stone-700 mb-2">Dosage <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={currentMedication.dosage || ""}
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))}
                        placeholder="e.g., 500mg"
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                        autoComplete="off"
                      />
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">Frequency <span className="text-red-500">*</span></label>
                      <select
                        value={currentMedication.frequency || ""}
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))}
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                      >
                        <option value="">Select frequency...</option>
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Three times daily">Three times daily</option>
                        <option value="As needed">As needed</option>
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-2">Duration <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={currentMedication.duration || ""}
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, duration: e.target.value }))}
                        placeholder="e.g., 7 days"
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                        autoComplete="off"
                      />
                    </div>

                    {/* Instructions */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-stone-700 mb-2">Special Instructions</label>
                      <input
                        type="text"
                        value={currentMedication.instructions || ""}
                        onChange={(e) => setCurrentMedication(prev => ({ ...prev, instructions: e.target.value }))}
                        placeholder="e.g., Take with food"
                        className="w-full px-4 py-2 border-2 border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Add Button */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddMedication}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition flex items-center gap-2"
                    >
                      <span>{editingMedicationIndex !== null ? '✏️' : '➕'}</span>
                      <span>{editingMedicationIndex !== null ? 'Update' : 'Add Medication'}</span>
                    </motion.button>
                    {editingMedicationIndex !== null && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCancelEdit}
                        className="px-6 py-2 bg-gray-500 text-white rounded-lg font-bold"
                      >
                        Cancel
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Medications List */}
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
                          className="bg-white rounded-xl p-4 border-2 border-purple-200 shadow-md"
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
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEditMedication(index)}
                                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                              >
                                ✏️
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDeleteMedication(index)}
                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                              >
                                🗑️
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Treatment Provided */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border-2 border-indigo-200 shadow-md">
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

              {/* Notes */}
              <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-7 border-2 border-gray-300 shadow-md">
                <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-3">
                  <span className="text-2xl">📝</span> Additional Notes
                </h3>
                <textarea
                  value={visitForm.notes}
                  onChange={(e) => handleVisitFormChange('notes', e.target.value)}
                  placeholder="Document any additional observations..."
                  rows={5}
                  className="w-full px-4 py-3 border-2 border-gray-400 rounded-xl focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition resize-none text-sm font-medium text-stone-800 bg-white"
                />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-8 py-5 rounded-b-3xl border-t-2 border-purple-200 flex justify-between items-center gap-4 flex-wrap flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="px-6 py-2.5 bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50 font-semibold transition-all rounded-lg"
          >
            ✕ Close
          </motion.button>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveVisit}
              disabled={savingVisit || !visitForm.chiefComplaint || !visitForm.diagnosis || !visitForm.treatmentProvided}
              className={`px-8 py-2.5 rounded-lg font-bold text-white transition shadow-lg flex items-center gap-2 ${
                savingVisit || !visitForm.chiefComplaint || !visitForm.diagnosis || !visitForm.treatmentProvided
                  ? 'bg-gray-300 cursor-not-allowed'
                  : isExistingVisit
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
              }`}
            >
              <span>{isExistingVisit ? '🔄' : '💾'}</span>
              <span>{savingVisit ? 'Processing...' : isExistingVisit ? 'Update Visit' : 'Save Visit'}</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

VisitInfoModal.displayName = 'VisitInfoModal';

export default React.memo(VisitInfoModal, (prevProps, nextProps) => {
  // Return TRUE if props are equal (skip re-render)
  // Return FALSE if props are different (do re-render)
  
  // CRITICAL: Check if diagnosis/treatment/notes/loaded changed
  const propsEqual = 
    prevProps.diagnosis === nextProps.diagnosis &&
    prevProps.treatment === nextProps.treatment &&
    prevProps.medications === nextProps.medications &&
    prevProps.notes === nextProps.notes &&
    prevProps.loadingMedicalInfo === nextProps.loadingMedicalInfo &&
    prevProps.show === nextProps.show &&
    prevProps.selectedAppointment?.appointmentId === nextProps.selectedAppointment?.appointmentId;
  
  if (!propsEqual) {
    console.log('🚨 [MEMO COMPARISON] Props changed - will re-render');
    console.log('   diagnosis changed:', prevProps.diagnosis !== nextProps.diagnosis);
    console.log('   treatment changed:', prevProps.treatment !== nextProps.treatment);
    console.log('   loadingMedicalInfo changed:', prevProps.loadingMedicalInfo !== nextProps.loadingMedicalInfo);
  }
  
  return propsEqual; // TRUE = skip re-render, FALSE = do re-render
});
