import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { addPatientVisit } from "../services/appointmentService";
import { editPatientVisit } from "../services/patientService";
import { sendPrescriptionEmail, sendEmail } from "../services/emailService";
import { searchDoctors } from "../services/doctorService";
import { getClinicByClinicId } from "../services/clinicService";
import { getDoctorIdFromToken } from "../services/tokenManager";
import PrescriptionPrint from "./PrescriptionPrint";
import PrescriptionEmailTemplate from "./PrescriptionEmailTemplate";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./VisitInfoModal.css";

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
  // Full visit history for this appointment (latest first), the visitId currently
  // loaded into the form (null = fresh "new visit" entry), and whether the
  // reference panel of other visits is expanded.
  const [allVisits, setAllVisits] = useState([]);
  const [activeVisitId, setActiveVisitId] = useState(null);
  const [showPreviousVisits, setShowPreviousVisits] = useState(false);
  // 'new' = the active visit-entry form, 'history' = browsing past visits
  const [activeSectionTab, setActiveSectionTab] = useState('new');
  const EMPTY_MEDICATION = {
    name: '',
    medicationType: 'Tablet',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    mealTiming: 'Before Food'
  };
  const [localCurrentMedication, setLocalCurrentMedication] = useState({ ...EMPTY_MEDICATION });
  const [localInlineMedications, setLocalInlineMedications] = useState([]);
  const [localEditingMedicationIndex, setLocalEditingMedicationIndex] = useState(null);
  const [localMedicineDropdownOpen, setLocalMedicineDropdownOpen] = useState(false);
  const [viewedPrescription, setViewedPrescription] = useState(null);
  const [showViewPrescriptionModal, setShowViewPrescriptionModal] = useState(false);
  const [printPrescriptionData, setPrintPrescriptionData] = useState(null);
  const [showPrintPreviewModal, setShowPrintPreviewModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showEmailSuccessModal, setShowEmailSuccessModal] = useState(false);
  
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

  const EMPTY_VISIT_FORM = {
    visitDate: new Date().toISOString().split('T')[0],
    chiefComplaint: '',
    diagnosis: '',
    treatmentProvided: '',
    prescriptions: '',
    followUpDate: '',
    notes: ''
  };

  const getVisitId = (v) => v?.visitId ?? v?.VisitId ?? null;

  const mapVisitToForm = (v) => ({
    visitDate: v.visitDate ? v.visitDate.split('T')[0] : new Date().toISOString().split('T')[0],
    chiefComplaint: v.chiefComplaint || v.reasonForVisit || '',
    diagnosis: v.diagnosis || v.diagnoses || '',
    treatmentProvided: v.treatmentProvided || v.treatments || '',
    prescriptions: v.prescriptions || '',
    followUpDate: v.followUpDate ? v.followUpDate.split('T')[0] : '',
    notes: v.notes || ''
  });

  const mapVisitMedications = (v) => Array.isArray(v.prescriptions)
    ? v.prescriptions.map(med => ({
        name: med.medicineName || med.name || '',
        medicationType: med.medicationType || med.MedicationType || 'Tablet',
        dosage: med.dosage || '',
        frequency: med.frequency || '',
        duration: med.duration || '',
        instructions: med.specialInstructions || med.instructions || '',
        mealTiming: med.mealTiming || med.MealTiming || 'Before Food'
      }))
    : [];

  // Load a specific past visit into the active form for editing.
  const loadVisitIntoForm = (visit) => {
    setIsExistingVisit(true);
    setActiveVisitId(getVisitId(visit));
    setVisitForm(mapVisitToForm(visit));
    setLocalInlineMedications(mapVisitMedications(visit));
    setLocalCurrentMedication({ ...EMPTY_MEDICATION });
    setLocalEditingMedicationIndex(null);
  };

  // Blank the form for a brand new visit record (same appointment, new date).
  const startNewVisit = () => {
    setIsExistingVisit(false);
    setActiveVisitId(null);
    setVisitForm({ ...EMPTY_VISIT_FORM, visitDate: new Date().toISOString().split('T')[0] });
    setLocalInlineMedications([]);
    setLocalCurrentMedication({ ...EMPTY_MEDICATION });
    setLocalEditingMedicationIndex(null);
  };

  // Jump from the Visit History tab into the New Visit tab with that record loaded.
  const editVisitFromHistory = (visit) => {
    loadVisitIntoForm(visit);
    setActiveSectionTab('new');
  };

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

  // Load visit history - reload every time the modal opens for an appointment.
  // Default behavior: if the latest visit on record is from TODAY, keep editing it
  // (matches prior behavior). If the latest visit is from an earlier date, this is a
  // repeat visit for the same appointment — default to a fresh blank entry so the
  // doctor records a new visit, while every past visit stays available to reference
  // (and edit, if needed) in the collapsible Previous Visits panel.
  useEffect(() => {
    if (!show) return;

    const appointmentId = selectedAppointment?.appointmentId;
    if (!appointmentId) {
      setAllVisits([]);
      startNewVisit();
      return;
    }

    const history = Array.isArray(selectedAppointment?.visitHistory)
      ? selectedAppointment.visitHistory
      : (selectedAppointment?.existingVisitData ? [selectedAppointment.existingVisitData] : []);

    console.log('📚 Visit history for appointment', appointmentId, '— count:', history.length);
    setAllVisits(history);
    setShowPreviousVisits(false);
    setActiveSectionTab('new');

    if (history.length === 0) {
      startNewVisit();
      return;
    }

    const latest = history[0];
    const latestDateStr = latest.visitDate ? new Date(latest.visitDate).toDateString() : null;
    const todayStr = new Date().toDateString();

    if (latestDateStr === todayStr) {
      console.log('📥 Latest visit is from today — loading it for editing');
      loadVisitIntoForm(latest);
    } else {
      console.log('🆕 Latest visit is from a past date — starting a fresh visit entry');
      startNewVisit();
    }
  }, [show, selectedAppointment?.appointmentId, selectedAppointment?.existingVisitData, selectedAppointment?.visitHistory]);

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
    if (!currentMedication.name || !currentMedication.frequency || !currentMedication.duration) {
      alert('❌ Please fill in all required fields (Medicine Name, Frequency, Duration). Dosage is optional.');
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

    setCurrentMedication({ ...EMPTY_MEDICATION });
  }, [currentMedication, editingMedicationIndex, inlineMedications]);

  const handleEditMedication = (index) => {
    setCurrentMedication({ ...inlineMedications[index] });
    setEditingMedicationIndex(index);
  };

  const handleDeleteMedication = (index) => {
    setInlineMedications(inlineMedications.filter((_, i) => i !== index));
  };

  const handleCancelEdit = () => {
    setCurrentMedication({ ...EMPTY_MEDICATION });
    setEditingMedicationIndex(null);
  };

  // Shared helper — fetch doctor (SearchDoctors) + clinic (GetClinicByClinicId)
  // Prefers the appointment's own doctorId so we get the right doctor's license number,
  // then falls back to the logged-in user's token if the appointment has no doctorId.
  const loadDoctorAndClinic = async () => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");

    // Use the appointment's doctorId first — that's the physician who owns this visit
    const appointmentDoctorId = Number(selectedAppointment?.doctorId) || 0;
    const doctorId = appointmentDoctorId || getDoctorIdFromToken() || selectedAccess.doctorId || userData.doctorId || 0;
    const enterpriseId = selectedAccess.enterpriseId || userData.enterpriseId || 0;
    const clinicId    = selectedAccess.clinicId    || userData.clinicId    || 0;

    // Appointment-level doctor name — use as final fallback if API returns no name
    const apptDoctorName = selectedAppointment?.doctorName || selectedAppointment?.attendingPhysician || "";

    let doctorResult = null;
    let clinicResult = null;

    if (doctorId && enterpriseId) {
      try {
        const results = await searchDoctors({ doctorId, enterpriseId });
        const doc = Array.isArray(results) ? results[0] : results;
        if (doc) {
          const apiName = `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
          doctorResult = {
            doctorId: doc.doctorId,
            doctorName: apiName || apptDoctorName,
            firstName: doc.firstName || '',
            lastName: doc.lastName || '',
            speciality: doc.speciality || doc.specialtyName || '',
            registrationNumber: doc.licenseNumber || doc.LicenseNumber || ''
          };
        }
      } catch (e) {
        console.warn('SearchDoctors failed:', e);
      }
    }

    // If API returned nothing, build from appointment data
    if (!doctorResult && apptDoctorName) {
      doctorResult = {
        doctorId: selectedAppointment?.doctorId || 0,
        doctorName: apptDoctorName,
        firstName: '',
        lastName: '',
        speciality: '',
        registrationNumber: ''
      };
    }

    if (clinicId) {
      try {
        const clinicArr = await getClinicByClinicId([clinicId]);
        const clinic = Array.isArray(clinicArr) ? clinicArr[0] : clinicArr;
        if (clinic) clinicResult = clinic;
      } catch (e) {
        console.warn('GetClinicByClinicId failed:', e);
      }
    }

    return { doctorResult, clinicResult };
  };

  const handlePrintPrescription = async () => {
    const { doctorResult, clinicResult } = await loadDoctorAndClinic();

    setPrintPrescriptionData({
      prescriptionDate: new Date().toISOString(),
      diagnosis: visitForm.diagnosis,
      treatment: visitForm.treatmentProvided || '',
      medications: inlineMedications,
      notes: visitForm.notes,
      prescriptionContent: inlineMedications.map(m =>
        `${m.name} (${m.medicationType || 'Tablet'})${m.dosage ? ' - ' + m.dosage : ''} - ${m.frequency} - ${m.duration} - ${m.mealTiming || 'Before Food'}`
      ).join('\n')
    });
    setShowPrintPreviewModal(true);

    // Store for the print modal to consume
    setPrintPrescriptionData(prev => ({
      ...prev,
      _doctorInfo: doctorResult,
      _clinicInfo: clinicResult,
      _patientInfo: {
        firstName: selectedAppointment.firstName,
        lastName: selectedAppointment.lastName,
        dateOfBirth: selectedAppointment.dateOfBirth,
        gender: selectedAppointment.gender,
        phone: selectedAppointment.phone || selectedAppointment.phoneNumber
      }
    }));
  };

  const handleSendEmail = async () => {
    const userData = JSON.parse(localStorage.getItem("userData") || "{}");
    const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
    
    try {
      setSendingEmail(true);
      const patientEmail = selectedAppointment.email || '';
      if (!patientEmail) {
        alert('Patient email not available');
        setSendingEmail(false);
        return;
      }

      // Prepare prescription data for email template
      const prescriptionData = {
        prescriptionId: selectedAppointment.appointmentId,
        prescriptionDate: new Date().toISOString(),
        prescriptionContent: inlineMedications.map(med =>
          `${med.name} (${med.medicationType || 'Tablet'})${med.dosage ? ' - ' + med.dosage : ''} - ${med.frequency} - ${med.duration} - ${med.mealTiming || 'Before Food'}`
        ).join('\n')
      };

      const patientInfo = {
        firstName: selectedAppointment.firstName,
        lastName: selectedAppointment.lastName,
        email: patientEmail,
        phone: selectedAppointment.phone,
        patientId: selectedAppointment.patientId
      };

      // Doctor + Clinic: use logged-in user's IDs from localStorage
      const { doctorResult, clinicResult } = await loadDoctorAndClinic();
      const doctorInfo = doctorResult || {
        doctorName: userData.username || 'Doctor',
        registrationNumber: ''
      };
      const clinicInfo = clinicResult || {
        clinicName: userData.clinicName || 'Clinic',
        clinicAddress: userData.clinicAddress || '',
        clinicPhone: userData.clinicPhone || '',
        clinicEmail: userData.clinicEmail || ''
      };

      // Use the email template
      console.log('📧 PASSING TO EMAIL TEMPLATE:');
      console.log('   patientInfo:', patientInfo);
      console.log('   doctorInfo:', doctorInfo);
      console.log('   clinicInfo:', clinicInfo);
      
      const emailTemplate = PrescriptionEmailTemplate({ 
        prescription: prescriptionData, 
        patientInfo, 
        doctorInfo, 
        clinicInfo 
      });
      const emailHTML = emailTemplate.getHTML();

      // Send email directly
      const response = await sendEmail({
        Email: patientEmail,
        Subject: `Prescription from Dr. ${doctorInfo.doctorName} - ${clinicInfo.clinicName}`,
        HtmlBody: emailHTML
      });

      console.log('📧 EMAIL SEND RESPONSE:', response);

      if (response.success) {
        // Show success modal
        setShowEmailSuccessModal(true);
        // Auto-close modals after 2 seconds
        setTimeout(() => {
          setShowEmailModal(false);
          setShowEmailSuccessModal(false);
        }, 2000);
      } else {
        alert(`❌ Failed to send email: ${response.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      alert(`❌ Error sending email: ${error.message || 'Please try again.'}`);
    } finally {
      setSendingEmail(false);
    }
  };

  const generatePrescriptionPDF = async () => {
    try {
      // Wait for modal to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const prescriptionElement = document.querySelector('.prescription-print-container');
      if (!prescriptionElement) {
        alert('❌ Could not find prescription template. Please try again.');
        return;
      }

      // Show loading indicator
      const originalContent = document.body.innerHTML;
      
      // Capture the prescription element as canvas
      const canvas = await html2canvas(prescriptionElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add image to PDF, handling multi-page PDFs if needed
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Download the PDF
      const patientName = `${selectedAppointment.firstName || 'Patient'}_${selectedAppointment.lastName || 'Name'}`;
      const timestamp = new Date().toISOString().split('T')[0];
      pdf.save(`Prescription_${patientName}_${timestamp}.pdf`);
      
      alert('✅ Prescription PDF downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('❌ Error generating PDF. Please try again.');
    }
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

    if (inlineMedications.length === 0) {
      alert('❌ Please add at least one medication in the Write Prescription section before saving.');
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
        MedicationType: med.medicationType || 'Tablet',
        Dosage: med.dosage || '',
        Frequency: med.frequency,
        Duration: med.duration,
        MealTiming: med.mealTiming || 'Before Food',
        SpecialInstructions: med.instructions || '',
        GeneralPrescriptionNotes: `Type: ${med.medicationType || 'Tablet'} | ${med.mealTiming || 'Before Food'}`
      }));

      const visitData = {
        ...(isExistingVisit && activeVisitId ? { VisitId: activeVisitId } : {}),
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

      const savedVisitData = {
        visitDate: visitForm.visitDate,
        reasonForVisit: visitForm.chiefComplaint,
        diagnosis: visitForm.diagnosis,
        treatmentProvided: visitForm.treatmentProvided,
        notes: visitForm.notes || '',
        followUpDate: visitForm.followUpDate || null,
        prescriptions
      };
      
      setTimeout(() => {
        if (typeof onVisitSaved === 'function') {
          onVisitSaved(savedVisitData);
        } else if (typeof onClose === 'function') {
          onClose();
        }
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

  const requiredFieldsMissing = !visitForm.chiefComplaint || !visitForm.diagnosis || !visitForm.treatmentProvided;
  const historyVisits = allVisits; // browse everything in the History tab, including the one being edited

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
        className="dpv w-full"
      >
        <div className="dpv-modal">
          {/* Header */}
          <div className="dpv-header bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
            <div className="dpv-avatar dpv-serif bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              {selectedAppointment.firstName?.charAt(0)}{selectedAppointment.lastName?.charAt(0)}
            </div>
            <div className="dpv-header-text">
              <h1 className="dpv-serif">Diagnosis &amp; Patient Visit</h1>
              <div className="dpv-header-meta dpv-mono text-purple-100">
                <b className="text-white">{selectedAppointment.firstName} {selectedAppointment.lastName}</b>&nbsp;·&nbsp;Patient ID #{selectedAppointment.patientId}
              </div>
            </div>
            <button type="button" className="dpv-close-btn bg-white/20 hover:bg-white/30 text-white" onClick={onClose} title="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          {/* Body */}
          <div className="dpv-body bg-white">
            {/* LEFT CHART RAIL */}
            <aside className="dpv-rail bg-gradient-to-b from-indigo-50/40 to-purple-50/40">
              <div className="dpv-rail-card bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
                <div className="dpv-rail-eyebrow text-blue-900">
                  <svg className="dpv-rail-icon stroke-indigo-600" viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><circle cx="12" cy="8" r="3.2" /><path d="M5 20c0-3.9 3.1-6.5 7-6.5s7 2.6 7 6.5" /></svg>
                  Patient
                </div>
                <p className="dpv-patient-name dpv-serif text-stone-800">{selectedAppointment.firstName} {selectedAppointment.lastName}</p>
                <div className="dpv-contact-row border-t border-blue-100 text-stone-600"><span>Phone</span><span className="text-stone-800 font-bold">{selectedAppointment.phoneNumber || 'N/A'}</span></div>
                <div className="dpv-contact-row border-t border-blue-100 text-stone-600"><span>Email</span><span className="text-stone-800 font-bold">{selectedAppointment.email || 'N/A'}</span></div>
              </div>

              <div className={`dpv-rail-card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 ${!loadingMedicalInfo && !medicalInfoError && chronicDiseaseList.length > 0 ? 'dpv-alert' : ''}`}>
                <div className="dpv-rail-eyebrow text-red-900">
                  <svg className="dpv-rail-icon stroke-red-500" viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M12 3l9 16H3z" /><line x1="12" y1="9" x2="12" y2="13" /><circle cx="12" cy="16" r="0.6" fill="currentColor" /></svg>
                  Chronic Diseases
                </div>
                {loadingMedicalInfo ? (
                  <p className="dpv-empty-note text-stone-500">Checking medical history...</p>
                ) : medicalInfoError ? (
                  <p className="dpv-empty-note text-amber-600">Unavailable — backend error</p>
                ) : chronicDiseaseList.length === 0 ? (
                  <p className="dpv-empty-note text-stone-500">None recorded</p>
                ) : (
                  chronicDiseaseList.map((disease, idx) => (
                    <p key={`${disease}-${idx}`} className="text-stone-800 font-semibold" style={{ fontSize: 12.5, margin: '4px 0' }}>✓ {disease}</p>
                  ))
                )}
              </div>

              <div className={`dpv-rail-card bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 ${!loadingMedicalInfo && !medicalInfoError && allergyList.length > 0 ? 'dpv-alert' : ''}`}>
                <div className="dpv-rail-eyebrow text-orange-900">
                  <svg className="dpv-rail-icon stroke-orange-500" viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><path d="M12 21s-7-4.35-9.5-9C.5 7.5 3 4 6.5 4c2 0 3.5 1.5 4.5 3 1-1.5 2.5-3 4.5-3 3.5 0 6 3.5 4 8-2.5 4.65-7.5 9-7.5 9z" transform="scale(0.9) translate(1.3,1.3)" /></svg>
                  Allergies
                </div>
                {loadingMedicalInfo ? (
                  <p className="dpv-empty-note text-stone-500">Checking allergy data...</p>
                ) : medicalInfoError ? (
                  <p className="dpv-empty-note text-amber-600">Unavailable — backend error</p>
                ) : allergyList.length === 0 ? (
                  <p className="dpv-empty-note text-stone-500">None recorded</p>
                ) : (
                  allergyList.map((allergy, idx) => (
                    <p key={`${allergy}-${idx}`} className="text-stone-800 font-semibold" style={{ fontSize: 12.5, margin: '4px 0' }}>⚠ {allergy}</p>
                  ))
                )}
              </div>

              <div className="dpv-rail-card bg-gradient-to-br from-violet-50 to-purple-50 border-2 border-violet-200">
                <div className="dpv-rail-eyebrow text-violet-900">
                  <svg className="dpv-rail-icon stroke-violet-600" viewBox="0 0 24 24" fill="none" strokeWidth="1.8"><rect x="3" y="4.5" width="18" height="16" rx="2" /><line x1="3" y1="9.5" x2="21" y2="9.5" /><line x1="7" y1="2.5" x2="7" y2="6.5" /><line x1="17" y1="2.5" x2="17" y2="6.5" /></svg>
                  Appointment
                </div>
                <div className="dpv-appt-line text-stone-600">Date &nbsp;<b className="text-stone-800">{selectedAppointment.appointmentDate ? new Date(selectedAppointment.appointmentDate).toLocaleDateString() : 'N/A'}</b></div>
                <div className="dpv-appt-line text-stone-600">Time &nbsp;<b className="text-stone-800">{selectedAppointment.startTime || 'N/A'}</b></div>
                {selectedAppointment.appointmentType && <span className="dpv-tag-chip bg-violet-100 text-violet-800">{selectedAppointment.appointmentType}</span>}
              </div>
            </aside>

            {/* MAIN */}
            <main className="dpv-main">
              <div className="dpv-tabs bg-white border-b border-slate-200">
                <button type="button" className={`dpv-tab ${activeSectionTab === 'new' ? 'dpv-active text-purple-700 border-purple-600' : 'text-stone-500'}`} onClick={() => setActiveSectionTab('new')}>
                  {isExistingVisit ? 'Edit Visit' : 'New Visit'}
                </button>
                <button type="button" className={`dpv-tab ${activeSectionTab === 'history' ? 'dpv-active text-purple-700 border-purple-600' : 'text-stone-500'}`} onClick={() => setActiveSectionTab('history')}>
                  Visit History <span className="dpv-count bg-purple-100 text-purple-800">{historyVisits.length}</span>
                </button>
              </div>

              {/* NEW / EDIT VISIT PANEL */}
              {activeSectionTab === 'new' && (
                <div className="dpv-panel">
                  {isExistingVisit && (
                    <div className="flex items-center justify-between gap-3 flex-wrap bg-blue-50 border border-blue-300 text-blue-800" style={{ borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 12.5 }}>
                      <span>✏️ Editing the visit from <b>{visitForm.visitDate ? new Date(visitForm.visitDate).toLocaleDateString() : ''}</b></span>
                      {allVisits.length > 0 && (
                        <button type="button" className="dpv-acc-edit bg-blue-100 text-blue-800 hover:bg-blue-200" onClick={startNewVisit}>Start Fresh Instead</button>
                      )}
                    </div>
                  )}

                  <div className="dpv-card bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
                    <h3 className="dpv-card-title dpv-serif text-yellow-900">
                      <span className="dpv-icon-badge bg-indigo-100"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="stroke-indigo-700"><rect x="3" y="4.5" width="18" height="16" rx="2" /><line x1="3" y1="9.5" x2="21" y2="9.5" /><line x1="7" y1="2.5" x2="7" y2="6.5" /><line x1="17" y1="2.5" x2="17" y2="6.5" /></svg></span>
                      Visit Timeline
                    </h3>
                    <div className="dpv-field-grid">
                      <div>
                        <label className="text-stone-700">Visit Date <span className="dpv-req text-red-500">*</span></label>
                        <input type="date" className="border-2 border-green-300 bg-white focus:border-green-500" value={visitForm.visitDate} onChange={(e) => handleVisitFormChange('visitDate', e.target.value)} />
                      </div>
                      <div>
                        <label className="text-stone-700">Follow-up Date</label>
                        <input type="date" className="border-2 border-green-300 bg-white focus:border-green-500" value={visitForm.followUpDate} onChange={(e) => handleVisitFormChange('followUpDate', e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="dpv-card dpv-required bg-gradient-to-br from-pink-50 to-rose-50 border-2 border-pink-200">
                    <h3 className="dpv-card-title dpv-serif text-pink-900">
                      <span className="dpv-icon-badge bg-pink-100"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="stroke-pink-700"><path d="M9 12h6M9 16h6M9 8h3" /><path d="M7 3h10a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" /></svg></span>
                      Chief Complaint <span className="dpv-req text-red-500">*</span>
                    </h3>
                    <textarea
                      className="border-2 border-pink-300 bg-white focus:border-pink-500"
                      value={visitForm.chiefComplaint}
                      onChange={(e) => handleVisitFormChange('chiefComplaint', e.target.value)}
                      placeholder="What is the main reason for the visit?"
                      rows={2}
                    />
                  </div>

                  <div className="dpv-card dpv-required bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 ring-2 ring-indigo-100">
                    <h3 className="dpv-card-title dpv-serif text-green-900">
                      <span className="dpv-icon-badge bg-green-100"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="stroke-green-700"><circle cx="11" cy="11" r="6.5" /><line x1="20" y1="20" x2="15.7" y2="15.7" /></svg></span>
                      Diagnostics <span className="dpv-req text-red-500">*</span>
                    </h3>
                    <textarea
                      className="border-2 border-green-300 bg-white focus:border-green-500 font-medium text-stone-800"
                      value={visitForm.diagnosis}
                      onChange={(e) => handleVisitFormChange('diagnosis', e.target.value)}
                      placeholder="Enter detailed diagnosis based on examination and findings..."
                      rows={3}
                    />
                  </div>

                  <div className="dpv-card dpv-required bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
                    <h3 className="dpv-card-title dpv-serif text-blue-900">
                      <span className="dpv-icon-badge bg-blue-100"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="stroke-blue-700"><path d="M4 15l5-5 3.5 3.5L20 6" /><path d="M14 6h6v6" /></svg></span>
                      Treatment Provided <span className="dpv-req text-red-500">*</span>
                    </h3>
                    <textarea
                      className="border-2 border-blue-300 bg-white focus:border-blue-500"
                      value={visitForm.treatmentProvided}
                      onChange={(e) => handleVisitFormChange('treatmentProvided', e.target.value)}
                      placeholder="Describe the treatment provided during this visit..."
                      rows={3}
                    />
                  </div>

                  {/* WRITE PRESCRIPTION */}
                  <div className="dpv-card dpv-gold bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300">
                    <h3 className="dpv-card-title dpv-serif text-purple-900">
                      <span className="dpv-icon-badge bg-purple-100"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="stroke-purple-700"><rect x="5" y="9" width="14" height="10" rx="2" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></svg></span>
                      Write Prescription
                      <span className="dpv-hint text-red-500 font-semibold" style={{ fontFamily: 'inherit' }}>— at least 1 medication required</span>
                    </h3>

                    <div className="dpv-rx-pad bg-white border-2 border-purple-200">
                      <div className="dpv-rx-row">
                        <div className="dpv-rx-field dpv-rx-name" ref={medicineInputRef}>
                          <label className="text-stone-700"><span className="dpv-step bg-purple-600 text-white">1</span>Medicine Name *</label>
                          <input
                            type="text"
                            className="border-2 border-purple-300 bg-white focus:border-purple-500"
                            value={currentMedication.name || ""}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              setCurrentMedication(prev => ({ ...prev, name: newValue }));
                              if (!medicineDropdownOpen) setMedicineDropdownOpen(true);
                            }}
                            onFocus={() => {
                              if (inventoryMeds.length === 0 && !loadingMeds) loadInventoryMedications();
                              setMedicineDropdownOpen(true);
                            }}
                            placeholder="Search medicine..."
                            autoComplete="off"
                          />
                          {currentMedication.name && !medicineDropdownOpen && (
                            <div className="bg-green-50 border border-green-300" style={{ marginTop: 4, padding: '6px 10px', borderRadius: 8, fontSize: 12 }}>
                              <span className="text-green-700 font-semibold">✓ Selected:</span> {currentMedication.name}
                            </div>
                          )}
                          {medicineDropdownOpen && (
                            <div className="absolute z-30 mt-1 bg-white border-2 border-purple-200 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto" style={{ width: '100%', minWidth: 280 }}>
                              {loadingMeds ? (
                                <div className="px-3 py-8 text-center">
                                  <div className="inline-block w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-2"></div>
                                  <p className="text-sm text-stone-600">Loading medicines...</p>
                                </div>
                              ) : inventoryMeds.length === 0 ? (
                                <div className="px-4 py-6 text-center">
                                  <p className="text-sm mb-3 text-stone-600">No medicines in inventory. Add one to get started!</p>
                                  <button
                                    type="button"
                                    onClick={() => { handleOpenAddMedicineModal(currentMedication.name); setMedicineDropdownOpen(false); }}
                                    className="dpv-add-btn bg-purple-600 text-white hover:bg-purple-700"
                                    style={{ margin: '0 auto' }}
                                  >
                                    + Add to Inventory
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
                                      onClick={() => { setCurrentMedication(prev => ({ ...prev, name: m.itemName })); setMedicineDropdownOpen(false); }}
                                      className="w-full text-left px-4 py-3 hover:bg-purple-50 transition border-b border-purple-50 last:border-b-0"
                                    >
                                      <div className="font-semibold text-stone-800">{m.itemName}{m.itemCode ? ` (${m.itemCode})` : ""}</div>
                                      <div className="text-xs flex gap-3 flex-wrap text-stone-500">
                                        {m.category && <span>Category: {m.category}</span>}
                                        {m.unit && <span>Unit: {m.unit}</span>}
                                      </div>
                                    </button>
                                  ))}
                                  <div className="sticky bottom-0 p-3 border-t border-purple-200 bg-slate-100">
                                    <button
                                      type="button"
                                      onClick={() => { handleOpenAddMedicineModal(currentMedication.name); setMedicineDropdownOpen(false); }}
                                      className="dpv-add-btn bg-purple-600 text-white hover:bg-purple-700"
                                      style={{ width: '100%', justifyContent: 'center' }}
                                    >
                                      + Add New Medicine
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="dpv-rx-field dpv-rx-type">
                          <label className="text-stone-700"><span className="dpv-step bg-purple-600 text-white">2</span>Type *</label>
                          <select className="border-2 border-purple-300 bg-white focus:border-purple-500" value={currentMedication.medicationType || "Tablet"} onChange={(e) => setCurrentMedication(prev => ({ ...prev, medicationType: e.target.value }))}>
                            <option value="Tablet">Tablet</option>
                            <option value="Syrup">Syrup</option>
                            <option value="Capsule">Capsule</option>
                            <option value="Injection">Injection</option>
                            <option value="Cream">Cream</option>
                            <option value="Gel">Gel</option>
                            <option value="Powder">Powder</option>
                            <option value="Liquid">Liquid</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="dpv-rx-field dpv-rx-dosage">
                          <label className="text-stone-700"><span className="dpv-step bg-purple-600 text-white">3</span>Dosage</label>
                          <input type="text" className="border-2 border-purple-300 bg-white focus:border-purple-500" value={currentMedication.dosage || ""} onChange={(e) => setCurrentMedication(prev => ({ ...prev, dosage: e.target.value }))} placeholder="500mg" autoComplete="off" />
                        </div>

                        <div className="dpv-rx-field dpv-rx-freq">
                          <label className="text-stone-700"><span className="dpv-step bg-purple-600 text-white">4</span>Frequency *</label>
                          <select className="border-2 border-purple-300 bg-white focus:border-purple-500" value={currentMedication.frequency || ""} onChange={(e) => setCurrentMedication(prev => ({ ...prev, frequency: e.target.value }))}>
                            <option value="">Select...</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="As needed">As needed</option>
                          </select>
                        </div>

                        <div className="dpv-rx-field dpv-rx-duration">
                          <label className="text-stone-700"><span className="dpv-step bg-purple-600 text-white">5</span>Duration *</label>
                          <input type="text" className="border-2 border-purple-300 bg-white focus:border-purple-500" value={currentMedication.duration || ""} onChange={(e) => setCurrentMedication(prev => ({ ...prev, duration: e.target.value }))} placeholder="7 days" autoComplete="off" />
                        </div>

                        <div className="dpv-rx-field dpv-rx-meal">
                          <label className="text-stone-700"><span className="dpv-step bg-purple-600 text-white">6</span>Meal Timing</label>
                          <div className="dpv-meal-toggle border-2 border-purple-300 bg-white text-stone-700">
                            <label>
                              <input type="radio" className="accent-purple-600" checked={currentMedication.mealTiming === 'Before Food'} onChange={() => setCurrentMedication(prev => ({ ...prev, mealTiming: 'Before Food' }))} />
                              Before
                            </label>
                            <label>
                              <input type="radio" className="accent-purple-600" checked={currentMedication.mealTiming === 'After Food'} onChange={() => setCurrentMedication(prev => ({ ...prev, mealTiming: 'After Food' }))} />
                              After
                            </label>
                          </div>
                        </div>

                        <div className="dpv-rx-field dpv-rx-instructions">
                          <label className="text-stone-700"><span className="dpv-step bg-purple-600 text-white">7</span>Instructions</label>
                          <input type="text" className="border-2 border-purple-300 bg-white focus:border-purple-500" value={currentMedication.instructions || ""} onChange={(e) => setCurrentMedication(prev => ({ ...prev, instructions: e.target.value }))} placeholder="Take with food" autoComplete="off" />
                        </div>

                        <button type="button" className="dpv-add-btn bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:brightness-105" onClick={handleAddMedication}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                          {editingMedicationIndex !== null ? 'Update' : 'Add'}
                        </button>
                        {editingMedicationIndex !== null && (
                          <button type="button" className="dpv-cancel-btn bg-gray-500 text-white border-gray-500" onClick={handleCancelEdit}>Cancel</button>
                        )}
                      </div>

                      {inlineMedications.length > 0 && (
                        <div className="dpv-rx-list">
                          {inlineMedications.map((med, index) => (
                            <div key={index} className="dpv-rx-item bg-white border border-purple-200">
                              <span className="dpv-pill bg-purple-100 text-purple-700">{index + 1}</span>
                              <span className="dpv-med-name text-stone-800">{med.name}</span>
                              <span className="dpv-med-sub text-stone-600">
                                {med.medicationType || 'Tablet'} · {med.dosage || 'no dosage'} · {med.frequency} · {med.duration} · {med.mealTiming || 'Before Food'}
                                {med.instructions ? ` · ${med.instructions}` : ''}
                              </span>
                              <span className="dpv-rx-actions">
                                <button type="button" className="dpv-edit-med text-blue-600" onClick={() => handleEditMedication(index)} title="Edit">✏️</button>
                                <button type="button" className="dpv-remove text-red-500" onClick={() => handleDeleteMedication(index)} title="Remove">✕</button>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {inlineMedications.length > 0 && (
                      <div className="dpv-prescription-actions">
                        <button type="button" className="dpv-btn bg-white border-2 border-blue-400 text-blue-700 hover:bg-blue-50" onClick={handlePrintPrescription}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
                          Print
                        </button>
                        <button type="button" className="dpv-btn bg-white border-2 border-green-400 text-green-700 hover:bg-green-50" onClick={() => setShowEmailModal(true)}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
                          Email to patient
                        </button>
                        <button
                          type="button"
                          className="dpv-btn bg-white border-2 border-green-500 text-green-700 hover:bg-green-50"
                          onClick={() => {
                            const patientPhone = selectedAppointment.phone || selectedAppointment.patientPhone || '';
                            if (!patientPhone) { alert('Patient phone number not available'); return; }
                            const medicationsText = inlineMedications.map(m => `${m.name} (${m.medicationType || 'Tablet'})${m.dosage ? ' - ' + m.dosage : ''} - ${m.frequency} - ${m.duration} - ${m.mealTiming || 'Before Food'}`).join('\n');
                            const prescriptionText = `🏥 *Prescription from Dr. ${selectedAppointment.doctorName || 'Doctor'}*\n\n📋 *Medications:*\n${medicationsText}\n\n📝 *Diagnosis:* ${visitForm.diagnosis}\n\n*For queries, please contact the clinic.* ☺️`;
                            const encodedText = encodeURIComponent(prescriptionText);
                            window.open(`https://api.whatsapp.com/send?phone=${patientPhone}&text=${encodedText}`, '_blank');
                          }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 11.5a8.5 8.5 0 0 1-12.4 7.6L3 20l1-5.4A8.5 8.5 0 1 1 21 11.5z" /></svg>
                          WhatsApp
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="dpv-card bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-300">
                    <h3 className="dpv-card-title dpv-serif text-gray-900">
                      <span className="dpv-icon-badge bg-gray-200"><svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" className="stroke-gray-700"><path d="M4 21l4-1 11-11a2 2 0 0 0-3-3L5 17l-1 4z" /></svg></span>
                      Additional Notes
                    </h3>
                    <textarea
                      className="border-2 border-gray-400 bg-white focus:border-gray-500 text-sm font-medium text-stone-800"
                      value={visitForm.notes}
                      onChange={(e) => handleVisitFormChange('notes', e.target.value)}
                      placeholder="Document any additional observations..."
                      rows={5}
                    />
                  </div>
                </div>
              )}

              {/* VISIT HISTORY PANEL */}
              {activeSectionTab === 'history' && (
                <div className="dpv-panel">
                  {historyVisits.length === 0 ? (
                    <p className="dpv-empty-note text-stone-500">No previous visits recorded for this appointment yet.</p>
                  ) : (
                    historyVisits.map((v, idx) => {
                      const vId = getVisitId(v);
                      const isActive = vId !== null && vId === activeVisitId;
                      const rxCount = Array.isArray(v.prescriptions) ? v.prescriptions.length : 0;
                      return (
                        <details key={vId ?? idx} className="dpv-accordion bg-white border border-slate-200" open={idx === 0}>
                          <summary className="text-stone-800">
                            {v.visitDate ? new Date(v.visitDate).toLocaleDateString() : 'Unknown date'}
                            <span className="dpv-badge-type bg-purple-600 text-white">{isActive ? 'Currently loaded' : `${rxCount} Rx`}</span>
                          </summary>
                          <div className="dpv-acc-body border-t border-dashed border-slate-200 text-stone-600">
                            <p><b className="text-stone-800">Complaint:</b> {v.chiefComplaint || v.reasonForVisit || '—'}</p>
                            <p><b className="text-stone-800">Diagnosis:</b> {v.diagnosis || v.diagnoses || '—'}</p>
                            <p><b className="text-stone-800">Treatment:</b> {v.treatmentProvided || v.treatments || '—'}</p>
                            <p><b className="text-stone-800">Prescribed:</b> {rxCount > 0
                              ? v.prescriptions.map(p => `${p.medicineName || p.name}${p.dosage ? ' ' + p.dosage : ''}`).join(', ')
                              : 'None'}</p>
                            {!isActive && (
                              <button type="button" className="dpv-acc-edit bg-indigo-100 text-indigo-700 hover:bg-indigo-200" onClick={() => editVisitFromHistory(v)}>✏️ Edit this visit</button>
                            )}
                          </div>
                        </details>
                      );
                    })
                  )}
                </div>
              )}
            </main>
          </div>

          {/* Footer */}
          <div className="dpv-footer bg-gradient-to-r from-indigo-50 to-purple-50 border-t-2 border-purple-200">
            <div className="dpv-footer-left">
              <button type="button" className="dpv-btn bg-white border-2 border-stone-300 text-stone-700 hover:border-stone-500 hover:bg-stone-50" onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                Close
              </button>
            </div>
            <div className="dpv-footer-right">
              <button
                type="button"
                className={`dpv-btn text-white shadow-lg ${
                  savingVisit || requiredFieldsMissing
                    ? 'bg-gray-300 cursor-not-allowed'
                    : isExistingVisit
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                }`}
                onClick={handleSaveVisit}
                disabled={savingVisit || requiredFieldsMissing}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                {savingVisit ? 'Processing...' : isExistingVisit ? 'Update Visit' : 'Save Visit'}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Print Preview Modal */}
      <AnimatePresence>
        {showPrintPreviewModal && printPrescriptionData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
            onClick={() => setShowPrintPreviewModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border-2 border-blue-200"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 sticky top-0 flex items-center justify-between text-white">
                <h2 className="text-2xl font-bold">📋 Prescription Preview</h2>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      generatePrescriptionPDF();
                    }}
                    className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition text-sm"
                  >
                    📥 Download PDF
                  </motion.button>
                  <button
                    onClick={() => setShowPrintPreviewModal(false)}
                    className="text-2xl hover:bg-white/20 p-2 rounded-full transition"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
                <div className="bg-white">
                  <PrescriptionPrint
                    prescription={{
                      prescriptionId: selectedAppointment.appointmentId,
                      prescriptionDate: new Date().toISOString(),
                      diagnosis: visitForm.diagnosis || '',
                      treatment: visitForm.treatmentProvided || '',
                      notes: visitForm.notes || '',
                      prescriptionContent: JSON.stringify(
                        inlineMedications.map(m => ({
                          medicineName: m.name,
                          medicationType: m.medicationType || 'Tablet',
                          dosage: m.dosage,
                          frequency: m.frequency,
                          duration: m.duration,
                          mealTiming: m.mealTiming || 'Before Food',
                          specialInstructions: m.instructions
                        }))
                      )
                    }}
                    patientInfo={printPrescriptionData._patientInfo || {
                      firstName: selectedAppointment.firstName,
                      lastName: selectedAppointment.lastName,
                      dateOfBirth: selectedAppointment.dateOfBirth,
                      gender: selectedAppointment.gender,
                      phone: selectedAppointment.phone || selectedAppointment.phoneNumber
                    }}
                    doctorInfo={printPrescriptionData._doctorInfo || printPrescriptionData.doctorInfo}
                    clinicInfo={printPrescriptionData._clinicInfo || printPrescriptionData.clinicInfo}
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-2 border-green-200"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 flex items-center justify-between text-white">
                <h2 className="text-2xl font-bold">📧 Send Email</h2>
                <button
                  onClick={() => setShowEmailModal(false)}
                  className="text-2xl hover:bg-white/20 p-2 rounded-full transition"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>📧 Will send to:</strong>
                    <p className="mt-2 font-bold">{selectedAppointment.email || 'Patient Email'}</p>
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <p className="text-sm text-green-800">
                    <strong>📋 Email will include:</strong>
                    <ul className="mt-2 space-y-1 ml-4">
                      <li>✓ Clinic name & details</li>
                      <li>✓ Doctor information</li>
                      <li>✓ Prescription details</li>
                      <li>✓ Medications list</li>
                    </ul>
                  </p>
                </div>

                <div className="flex gap-3 pt-4 border-t-2 border-green-200">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEmailModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-200 text-slate-800 rounded-lg font-bold hover:bg-slate-300 transition text-sm"
                  >
                    ✕ Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSendEmail}
                    disabled={sendingEmail}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 text-sm"
                  >
                    {sendingEmail ? '📤 Sending...' : '📤 Send Email'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email Success Modal */}
      <AnimatePresence>
        {showEmailSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: "spring", damping: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full border-2 border-green-300"
            >
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                <h3 className="text-xl font-bold">✅ Email Sent Successfully!</h3>
              </div>
              <div className="p-6 space-y-4 text-center">
                <div className="text-5xl mb-4">✉️</div>
                <p className="text-lg font-bold text-slate-800">
                  Prescription sent successfully!
                </p>
                <p className="text-sm text-slate-600">
                  The prescription email has been sent to the patient. Closing in a moment...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
