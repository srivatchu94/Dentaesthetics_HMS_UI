import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { searchPatients, getPatientsByClinic, getPatientFullProfile, getPatientVisit } from "../services/patientService";
import { getClinicsByEnterpriseId, getClinicDoctorMappings, listDoctorProfiles } from "../services/doctorService";
import { getAppointmentsByPatient, createAppointment, updateAppointment } from "../services/appointmentService";
import { getSelectedAccess } from "../services/authService";

export default function ViewPatients() {
  const navigate = useNavigate();
  const location = useLocation();
  const isModal = location.state?.isModal;
  const [viewTab, setViewTab] = useState("search");
  const [filterData, setFilterData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    patientId: "",
    clinicId: ""
  });
  const [selectedClinicId, setSelectedClinicId] = useState("");
  const [patients, setPatients] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [clinicPatients, setClinicPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
  // Modal states
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  
  // Appointment states
  const [showAppointmentHistory, setShowAppointmentHistory] = useState(false);
  const [showBookAppointment, setShowBookAppointment] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [appointmentForm, setAppointmentForm] = useState({});
  
  // Patient search/filter states for booking
  const [patientSearchTerm, setPatientSearchTerm] = useState('');
  const [filteredPatientsForBooking, setFilteredPatientsForBooking] = useState([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [selectedClinicForBooking, setSelectedClinicForBooking] = useState(null);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  
  // Custom popup state
  const [showPopup, setShowPopup] = useState(false);
  const [popupConfig, setPopupConfig] = useState({ type: 'error', title: '', message: '', emoji: '🤔' });
  
  // Diagnosis modal states
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = useState(null);
  const [loadingDiagnosis, setLoadingDiagnosis] = useState(false);
  
  // Show custom popup function
  const showCustomPopup = (type, title, message, emoji) => {
    setPopupConfig({ type, title, message, emoji });
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 4000);
  };

  // Load clinics on component mount
  useEffect(() => {
    loadClinics();
  }, []);

  // Add print styles for diagnosis modal
  useEffect(() => {
    // Create and inject MINIMAL print styles - don't hide content
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        /* Only hide the interactive elements */
        .print\\:hidden, 
        button,
        .modal-backdrop,
        .modal-close-btn {
          display: none !important;
        }
        
        /* Make sure prescription table prints properly */
        table, tr, td, div {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        body {
          margin: 0;
          padding: 10mm;
        }
        
        @page {
          margin: 10mm;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, []);

  const loadClinics = async () => {
    try {
      // Get enterprise ID from login token payload
      const selectedAccess = getSelectedAccess();
      const enterpriseId = selectedAccess?.enterpriseId || 1;
      const clinicsData = await getClinicsByEnterpriseId(enterpriseId);
      setClinics(clinicsData || []);
    } catch (error) {
      console.error("Error loading clinics:", error);
      showCustomPopup('error', 'Oops!', 'The clinics seem to be playing hide and seek! 🙈 Please try again.', '🏥');
    }
  };

  const handleSearch = async () => {
    if (!filterData.firstName && !filterData.lastName && !filterData.dateOfBirth && !filterData.patientId && !filterData.clinicId) {
      showCustomPopup('warning', 'Hold On!', 'We need at least one clue to find your patient! 🕵️‍♂️ Try adding a name or ID.', '🔍');
      return;
    }

    setSearching(true);
    
    // Build search params outside try block so it's accessible in catch
    const searchParams = {};
    if (filterData.patientId) searchParams.patientId = parseInt(filterData.patientId);
    if (filterData.firstName) searchParams.firstName = filterData.firstName;
    if (filterData.lastName) searchParams.lastName = filterData.lastName;
    if (filterData.dateOfBirth) searchParams.dateOfBirth = filterData.dateOfBirth;
    if (filterData.clinicId) searchParams.clinicId = parseInt(filterData.clinicId);
    
    try {
      const results = await searchPatients(searchParams);
      setPatients(results || []);
      
      if (results && results.length === 0) {
        showCustomPopup('info', 'No Matches!', 'Looks like this patient is taking a vacation! 🏖️ Try different search terms.', '🤷‍♂️');
      }
    } catch (error) {
      console.error("❌ ========== PATIENT SEARCH ERROR ==========");
      console.error("🛑 PREVENTING ANY NAVIGATION/LOGOUT - ERROR WILL BE DISPLAYED HERE");
      console.error("📍 Search Parameters:", searchParams);
      console.error("🔴 Error Object:", error);
      console.error("📊 Error Status:", error?.status);
      console.error("📄 Error Message:", error?.message);
      console.error("📦 Error Response:", error?.response);
      
      // Log full error details if response exists
      if (error?.response) {
        console.error("🔍 Full API Response:");
        console.error("   Status:", error.response.status);
        console.error("   Status Text:", error.response.statusText);
        console.error("   Response Body:", error.response.data);
        
        // Try to parse if it's JSON
        try {
          const parsedError = JSON.parse(error.response.data);
          console.error("   Parsed Error:", parsedError);
        } catch (e) {
          console.error("   (Response is not JSON)");
        }
      }
      
      // Log session storage state
      console.error("🔐 Local Storage State:");
      console.error("   Access Token:", localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');
      console.error("   Refresh Token:", localStorage.getItem('refreshToken') ? 'EXISTS' : 'MISSING');
      console.error("   Selected Access:", localStorage.getItem('selectedAccess'));
      console.error("==========================================");
      
      // Check if it's an authentication error - SHOW ERROR BUT DON'T LOGOUT/REDIRECT
      if (error.status === 401 || error.status === 403) {
        console.error('🚨🚨🚨 ========== AUTHENTICATION ERROR DETECTED ========== 🚨🚨🚨');
        console.error('⏸️ SYSTEM PAUSED - DO NOT REDIRECT OR LOGOUT');
        console.error('📊 Error Status:', error.status);
        console.error('📄 Error Message:', error.message);
        console.error('📦 Error Response Data:', error?.response?.data);
        console.error('🔍 Full Error Object:', error);
        console.error('💡 TIP: Review all the logs above to understand why authentication failed');
        console.error('🔧 Check: Token validity, role permissions, backend logs');
        console.error('===============================================================');
        
        const errorMsg = error?.response?.data || error?.message || 'Access Denied';
        
        // Create persistent error message
        const errorDetails = `
🚫 AUTHENTICATION ERROR (${error.status})

API Response: ${errorMsg}

⚠️ IMPORTANT: 
- The console (F12) has detailed logs
- DO NOT close this alert yet
- Review the console logs first
- Token and permission details are logged above

Click OK after reviewing the console logs.`;
        
        alert(errorDetails);
        
        // Show popup but DON'T navigate away
        showCustomPopup('error', 'Access Denied!', `${error.status}: ${errorMsg}`, '🚫');
      } else if (error.message) {
        showCustomPopup('error', 'Whoopsie!', `Our search hamster fell off the wheel! 🐹 ${error.message}`, '⚠️');
      } else {
        showCustomPopup('error', 'Uh-oh!', 'The search elves are on strike! 🧝‍♂️ Give it another shot.', '🔧');
      }
    } finally {
      setSearching(false);
    }
  };

  const handleClinicSelect = async (clinicId) => {
    setSelectedClinicId(clinicId);
    if (!clinicId) {
      setClinicPatients([]);
      return;
    }

    setLoading(true);
    try {
      const patients = await getPatientsByClinic(parseInt(clinicId));
      setClinicPatients(patients || []);
    } catch (error) {
      console.error("Error loading patients for clinic:", error);
      showCustomPopup('error', 'Clinic Hiccup!', 'The patient list is doing yoga stretches! 🧘‍♀️ Try again in a moment.', '🏥');
    } finally {
      setLoading(false);
    }
  };

  const handleViewPatient = async (patient) => {
    setShowPatientModal(true);
    setLoadingPatientDetails(true);
    try {
      const fullProfile = await getPatientFullProfile(patient.patientId);
      setSelectedPatient(fullProfile);
    } catch (error) {
      console.error("Error fetching patient profile:", error);
      showCustomPopup('error', 'Profile Shy!', 'This patient profile is playing peek-a-boo! 👻 Let\'s try again.', '📋');
      setShowPatientModal(false);
    } finally {
      setLoadingPatientDetails(false);
    }
  };

  // Load appointment history for a patient
  const loadAppointmentHistory = async (patientId) => {
    setLoadingAppointments(true);
    try {
      const appointmentsData = await getAppointmentsByPatient(patientId);
      setAppointments(appointmentsData || []);
      setShowAppointmentHistory(true);
    } catch (error) {
      console.error("Error loading appointments:", error);
      showCustomPopup('error', 'Oops!', 'Could not load appointment history. Please try again! 📅', '❌');
    } finally {
      setLoadingAppointments(false);
    }
  };

  // Load diagnosis details for an appointment
  const loadDiagnosisDetails = async (appointmentId) => {
    console.log('🔍 loadDiagnosisDetails called with appointmentId:', appointmentId);
    console.log('📊 Current showDiagnosisModal state:', showDiagnosisModal);
    
    if (!appointmentId) {
      console.warn('⚠️ No appointment ID found');
      showCustomPopup('error', 'Oops!', 'No appointment ID found. Cannot load diagnosis details.', '❌');
      return;
    }
    
    console.log('📋 Setting loading state to true and opening diagnosis modal...');
    setLoadingDiagnosis(true);
    setShowDiagnosisModal(true);
    console.log('📋 showDiagnosisModal state setter called - should update to true');
    
    try {
      console.log('📋 Loading diagnosis for appointment ID:', appointmentId);
      const diagnosisData = await getPatientVisit(appointmentId);
      console.log('✅ Diagnosis data received:', diagnosisData);
      setSelectedDiagnosis(diagnosisData);
    } catch (error) {
      console.error("❌ Error loading diagnosis:", error);
      showCustomPopup('error', 'Oops!', 'Could not load diagnosis details. Please try again!', '🩺');
      setShowDiagnosisModal(false);
    } finally {
      setLoadingDiagnosis(false);
    }
  };

  // ============================================
  // PRINT METHOD 1: New Window Print (CLEANEST)
  // ============================================
  const printPrescriptionNewWindow = () => {
    if (!selectedDiagnosis) {
      alert('No diagnosis data available');
      return;
    }

    const prescriptionData = typeof selectedDiagnosis.prescriptions === 'string' 
      ? JSON.parse(selectedDiagnosis.prescriptions) 
      : selectedDiagnosis.prescriptions;

    const medicinesHTML = prescriptionData && Array.isArray(prescriptionData) && prescriptionData.length > 0
      ? prescriptionData.map((med, idx) => `
          <tr style="border: 1px solid #ddd; ${idx % 2 === 0 ? 'background-color: #fce7f3;' : ''}">
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center; font-weight: bold;">${idx + 1}</td>
            <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${med.medicineName || 'N/A'}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${med.dosage || '-'}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${med.frequency || '-'}</td>
            <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${med.duration || '-'}</td>
          </tr>
          ${med.specialInstructions ? `
            <tr style="background-color: #fef3c7;">
              <td colspan="5" style="padding: 8px; border: 1px solid #fcd34d;">
                <strong style="color: #92400e;">⚠️ Special Instructions:</strong> ${med.specialInstructions}
              </td>
            </tr>
          ` : ''}
        `).join('')
      : '<tr><td colspan="5" style="padding: 20px; text-align: center;">No medicines prescribed</td></tr>';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescription - ${selectedDiagnosis.patientId}</title>
        <style>
          * { margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; padding: 20px; background: white; }
          .header { text-align: center; border-bottom: 3px solid #333; margin-bottom: 20px; padding-bottom: 15px; }
          .header h1 { font-size: 24px; margin-bottom: 5px; }
          .clinic-info { text-align: center; font-size: 14px; color: #666; margin-bottom: 20px; }
          .info-section { margin: 15px 0; }
          .info-row { display: flex; margin-bottom: 8px; }
          .info-label { font-weight: bold; width: 150px; }
          .info-value { flex: 1; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background-color: #1f2937; color: white; padding: 12px; text-align: left; font-weight: bold; border: 1px solid #333; }
          td { padding: 10px; border: 1px solid #ddd; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #ddd; font-size: 12px; color: #666; }
          @media print { 
            body { padding: 0; }
            .print-btn { display: none; }
          }
          .print-btn { padding: 10px 20px; margin-bottom: 20px; background-color: #007bff; color: white; border: none; cursor: pointer; border-radius: 5px; }
        </style>
      </head>
      <body>
        <button class="print-btn" onclick="window.print(); return false;">🖨️ Print This Page</button>
        
        <div class="header">
          <h1>💊 PRESCRIPTION</h1>
          <p>Dental Care Center</p>
        </div>

        <div class="clinic-info">
          <p><strong>Address:</strong> Dental Clinic | <strong>Phone:</strong> +91-XXXXXXXXXX</p>
        </div>

        <div class="info-section">
          <div class="info-row">
            <span class="info-label"><strong>👤 Patient Name:</strong></span>
            <span class="info-value">${selectedDiagnosis.patientName || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label"><strong>🆔 Patient ID:</strong></span>
            <span class="info-value">${selectedDiagnosis.patientId || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label"><strong>👨‍⚕️ Doctor:</strong></span>
            <span class="info-value">${selectedDiagnosis.attendingPhysician || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label"><strong>📅 Visit Date:</strong></span>
            <span class="info-value">${selectedDiagnosis.visitDate ? new Date(selectedDiagnosis.visitDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div class="info-row">
            <span class="info-label"><strong>🩺 Diagnosis:</strong></span>
            <span class="info-value">${selectedDiagnosis.diagnoses || 'N/A'}</span>
          </div>
        </div>

        <h3 style="margin-top: 20px; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px;">💊 Prescribed Medicines</h3>
        <table>
          <thead>
            <tr>
              <th style="width: 40px;">#</th>
              <th>Medicine Name</th>
              <th style="width: 80px;">Dosage</th>
              <th style="width: 80px;">Frequency</th>
              <th style="width: 100px;">Duration</th>
            </tr>
          </thead>
          <tbody>
            ${medicinesHTML}
          </tbody>
        </table>

        ${selectedDiagnosis.notes ? `
          <div class="info-section">
            <strong>📝 Additional Notes:</strong>
            <p>${selectedDiagnosis.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>⚕️ This prescription is valid for 90 days from the date of issue.</p>
          <p style="margin-top: 10px;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ============================================
  // PRINT METHOD 2: Direct Modal Print
  // ============================================
  const printPrescriptionModal = () => {
    const element = document.querySelector('.print-modal-content');
    if (!element) {
      alert('Modal content not found');
      return;
    }
    window.print();
  };

  // ============================================
  // PRINT METHOD 3: Hidden Div Print
  // ============================================
  const printPrescriptionHidden = () => {
    if (!selectedDiagnosis) {
      alert('No diagnosis data available');
      return;
    }

    const prescriptionData = typeof selectedDiagnosis.prescriptions === 'string' 
      ? JSON.parse(selectedDiagnosis.prescriptions) 
      : selectedDiagnosis.prescriptions;

    let printContent = `
      <div style="padding: 20px; background: white;">
        <h1 style="text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px;">PRESCRIPTION</h1>
        <div style="margin: 20px 0;">
          <p><strong>Patient:</strong> ${selectedDiagnosis.patientName || 'N/A'}</p>
          <p><strong>Patient ID:</strong> ${selectedDiagnosis.patientId || 'N/A'}</p>
          <p><strong>Doctor:</strong> ${selectedDiagnosis.attendingPhysician || 'N/A'}</p>
          <p><strong>Date:</strong> ${selectedDiagnosis.visitDate ? new Date(selectedDiagnosis.visitDate).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Diagnosis:</strong> ${selectedDiagnosis.diagnoses || 'N/A'}</p>
        </div>

        <h3 style="margin-top: 20px;">Medicines:</h3>
        <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
          <tr style="background-color: #333; color: white;">
            <th style="border: 1px solid #000; padding: 10px; text-align: left;">#</th>
            <th style="border: 1px solid #000; padding: 10px; text-align: left;">Medicine</th>
            <th style="border: 1px solid #000; padding: 10px;">Dosage</th>
            <th style="border: 1px solid #000; padding: 10px;">Frequency</th>
            <th style="border: 1px solid #000; padding: 10px;">Duration</th>
          </tr>
    `;

    if (prescriptionData && Array.isArray(prescriptionData)) {
      prescriptionData.forEach((med, idx) => {
        printContent += `
          <tr style="${idx % 2 === 0 ? 'background-color: #fce7f3;' : ''}">
            <td style="border: 1px solid #ddd; padding: 10px;">${idx + 1}</td>
            <td style="border: 1px solid #ddd; padding: 10px; font-weight: bold;">${med.medicineName || 'N/A'}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${med.dosage || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${med.frequency || '-'}</td>
            <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${med.duration || '-'}</td>
          </tr>
        `;
        if (med.specialInstructions) {
          printContent += `
            <tr style="background-color: #fef3c7;">
              <td colspan="5" style="border: 1px solid #fcd34d; padding: 8px;">
                <strong>⚠️ Special Instructions:</strong> ${med.specialInstructions}
              </td>
            </tr>
          `;
        }
      });
    }

    printContent += `
        </table>
        <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #666;">
          ⚕️ This prescription is valid for 90 days from the date of issue.
        </p>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  // Open book appointment modal
  const openBookAppointment = () => {
    // Get enterprise and clinic IDs from login token payload
    const selectedAccess = getSelectedAccess();
    const enterpriseId = selectedAccess?.enterpriseId || 1;
    const clinicId = selectedAccess?.clinicId || selectedPatient?.patient?.patientClinicId || 1;
    
    setAppointmentForm({
      patientId: selectedPatient?.patient?.patientId,
      clinicId: clinicId,
      enterpriseId: enterpriseId,
      firstName: selectedPatient?.patient?.patientFirstName,
      lastName: selectedPatient?.patient?.patientLastName,
      phoneNumber: selectedPatient?.patientContact?.patientPhone,
      email: selectedPatient?.patientContact?.patientEmail,
      appointmentDate: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      durationMinutes: 60,
      appointmentType: 'Consultation',
      status: 'Scheduled',
      isConfirmed: false,
      paymentStatus: 'Pending',
      paidAmount: 0,
      pendingAmount: 0
    });
    
    // Load doctors for this clinic
    if (clinicId) {
      loadDoctorsForClinic(clinicId);
    }
    
    setShowBookAppointment(true);
  };

  // Load doctors for a specific clinic
  const loadDoctorsForClinic = async (clinicId) => {
    setLoadingDoctors(true);
    try {
      const mappings = await getClinicDoctorMappings(clinicId);
      const allDoctors = await listDoctorProfiles();
      
      // Filter doctors who are mapped to this clinic
      const clinicDoctorIds = mappings.map(m => m.doctorId);
      const clinicDoctors = allDoctors.filter(d => clinicDoctorIds.includes(d.doctorId));
      
      setDoctorsList(clinicDoctors);
    } catch (error) {
      console.error("Error loading doctors:", error);
      setDoctorsList([]);
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Filter patients for booking based on search term
  const handlePatientSearch = async (searchValue) => {
    setPatientSearchTerm(searchValue);
    if (!searchValue || searchValue.length < 2) {
      setFilteredPatientsForBooking([]);
      setShowPatientDropdown(false);
      return;
    }

    try {
      // Get clinic ID from selected access or selected patient
      const selectedAccess = getSelectedAccess();
      const clinicId = selectedPatient?.patient?.clinicId || selectedClinicForBooking || selectedAccess?.clinicId;
      
      if (clinicId) {
        const patientsInClinic = await getPatientsByClinic(clinicId);
        const filtered = patientsInClinic.filter(p => {
          const firstName = p.firstName?.toLowerCase() || '';
          const lastName = p.lastName?.toLowerCase() || '';
          const search = searchValue.toLowerCase();
          return firstName.includes(search) || lastName.includes(search);
        });
        setFilteredPatientsForBooking(filtered);
        setShowPatientDropdown(filtered.length > 0);
      }
    } catch (error) {
      console.error("Error filtering patients:", error);
    }
  };

  // Select patient from dropdown
  const handleSelectPatientForBooking = async (patient) => {
    setPatientSearchTerm(`${patient.firstName} ${patient.lastName}`);
    setShowPatientDropdown(false);
    
    // Load full patient details
    try {
      const fullProfile = await getPatientFullProfile(patient.patientId);
      setAppointmentForm({
        ...appointmentForm,
        patientId: fullProfile.patient.patientId,
        clinicId: fullProfile.patient.clinicId,
        firstName: fullProfile.patient.firstName,
        lastName: fullProfile.patient.lastName,
        phoneNumber: fullProfile.patientContact?.phoneNumber,
        email: fullProfile.patientContact?.patientEmail,
      });
      setSelectedClinicForBooking(fullProfile.patient.clinicId);
    } catch (error) {
      console.error("Error loading patient details:", error);
    }
  };

  // Save appointment
  const handleSaveAppointment = async () => {
    try {
      if (editingAppointment) {
        await updateAppointment({ ...editingAppointment, ...appointmentForm });
        showCustomPopup('success', 'Updated!', 'The appointment has been updated successfully! 🎉', '✅');
        setEditingAppointment(null);
        loadAppointmentHistory(selectedPatient?.patient?.patientId);
      } else {
        await createAppointment(appointmentForm);
        showCustomPopup('success', 'Booked!', '🎊 Woohoo! Your appointment is locked and loaded! The patient will be notified faster than you can say "cheese"! 😁', '🎉');
      }
      setShowBookAppointment(false);
      setAppointmentForm({});
    } catch (error) {
      console.error("Error saving appointment:", error);
      showCustomPopup('error', 'Failed!', 'Could not save appointment. Please try again! 😢', '❌');
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 overflow-hidden">
      {/* Compact Professional Header - White with Vibrant Accents */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b-4 border-purple-500 shadow-xl"
      >
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-xl shadow-purple-500/50"
              >
                <span className="text-xl">🔍</span>
              </motion.div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Patient Search Hub
                  <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full font-bold shadow-lg">Elite</span>
                </h1>
                <p className="text-xs text-gray-600">Professional Patient Discovery System</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="h-[calc(100vh-72px)] max-w-7xl mx-auto px-6 py-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-4 h-full flex flex-col"
        >
          {/* Compact Chip Tabs - Royal Blue & Gold Theme */}
          <div className="flex gap-2 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewTab("search")}
              className={`px-4 py-2 font-semibold text-sm transition-all rounded-full flex items-center gap-2 ${
                viewTab === "search"
                  ? "bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white shadow-lg shadow-blue-500/40"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              <span className="text-base">🔍</span>
              <span>Search</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewTab("clinic")}
              className={`px-4 py-2 font-semibold text-sm transition-all rounded-full flex items-center gap-2 ${
                viewTab === "clinic"
                  ? "bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white shadow-lg shadow-purple-500/40"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
            >
              <span className="text-base">🏥</span>
              <span>Clinic</span>
            </motion.button>
          </div>

          {/* Search Patients Tab */}
          {viewTab === "search" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Improved Readable Search Grid */}
              <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-4 mb-4 border-2 border-indigo-300 shadow-lg">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3">
                  <div>
                    <label className="text-[10px] font-bold text-blue-600 mb-1 block uppercase tracking-wide">👤 First Name</label>
                    <input
                      type="text"
                      value={filterData.firstName}
                      onChange={(e) => setFilterData({ ...filterData, firstName: e.target.value })}
                      placeholder="John"
                      className="w-full px-3 py-2.5 bg-white border-2 border-blue-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-indigo-600 mb-1 block uppercase tracking-wide">👥 Last Name</label>
                    <input
                      type="text"
                      value={filterData.lastName}
                      onChange={(e) => setFilterData({ ...filterData, lastName: e.target.value })}
                      placeholder="Doe"
                      className="w-full px-3 py-2.5 bg-white border-2 border-indigo-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-purple-600 mb-1 block uppercase tracking-wide">🎂 Birth Date</label>
                    <input
                      type="date"
                      value={filterData.dateOfBirth}
                      onChange={(e) => setFilterData({ ...filterData, dateOfBirth: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border-2 border-purple-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-pink-600 mb-1 block uppercase tracking-wide">🆔 Patient ID</label>
                    <input
                      type="number"
                      value={filterData.patientId}
                      onChange={(e) => setFilterData({ ...filterData, patientId: e.target.value })}
                      placeholder="1005"
                      className="w-full px-3 py-2.5 bg-white border-2 border-pink-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition text-sm font-medium shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-rose-600 mb-1 block uppercase tracking-wide">🏥 Clinic ID</label>
                    <input
                      type="number"
                      value={filterData.clinicId}
                      onChange={(e) => setFilterData({ ...filterData, clinicId: e.target.value })}
                      placeholder="1005"
                      className="w-full px-3 py-2.5 bg-white border-2 border-rose-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition text-sm font-medium shadow-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setFilterData({ firstName: "", lastName: "", dateOfBirth: "", patientId: "", clinicId: "" })}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition text-sm font-semibold shadow-md"
                  >
                    ↻ Clear
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(59, 130, 246, 0.6)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSearch}
                    disabled={searching}
                    className="flex-1 px-6 py-2 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-600 hover:via-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {searching ? "⏳ Searching..." : "🔍 Search Patients"}
                  </motion.button>
                </div>
              </div>

              {/* Compact Results Grid */}
              <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                  {searching ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center h-full"
                    >
                      <div className="text-center">
                        <motion.div
                          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="text-6xl mb-3"
                        >
                          🔮
                        </motion.div>
                        <p className="text-blue-300 font-bold text-lg">Searching dimensions...</p>
                      </div>
                    </motion.div>
                  ) : patients.length > 0 ? (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-3 px-2">
                        <span className="text-pink-200 font-semibold text-sm">
                          ✨ Found {patients.length} patient{patients.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto pr-2 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#818cf8 transparent' }}>
                        {patients.map((patient, idx) => (
                          <motion.div
                            key={patient.patientId || idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            whileHover={{ scale: 1.02, x: 4 }}
                            onClick={() => handleViewPatient(patient)}
                            className="bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 hover:from-indigo-500/30 hover:via-purple-500/30 hover:to-pink-500/30 border-2 border-indigo-400/40 hover:border-pink-400/60 rounded-xl p-3 cursor-pointer transition-all shadow-lg hover:shadow-purple-500/30 group"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-lg flex-shrink-0">
                                {(patient.firstName || patient.patientFirstName || 'P').charAt(0)}
                                {(patient.lastName || patient.patientLastName || 'N').charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-bold text-sm truncate group-hover:text-pink-200 transition">
                                  {patient.firstName || patient.patientFirstName} {patient.lastName || patient.patientLastName}
                                </h4>
                                <p className="text-indigo-200/70 text-xs truncate">
                                  ID: {patient.patientId}
                                </p>
                                <div className="flex gap-1.5 mt-1">
                                  <span className="text-[10px] px-2 py-0.5 bg-indigo-400/30 text-indigo-200 rounded-full border border-indigo-400/50">
                                    {(patient.gender || patient.patientGender) === 'Male' ? '👨 M' : '👩 F'}
                                  </span>
                                  <span className="text-[10px] px-2 py-0.5 bg-purple-400/30 text-purple-200 rounded-full border border-purple-400/50">
                                    🎂 {new Date(patient.dateOfBirth || patient.patientDOB).getFullYear()}
                                  </span>
                                </div>
                              </div>
                              <div className="flex gap-1.5">
                                <motion.button 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate('/calendar', { state: { patientData: patient }});
                                  }}
                                  className="w-8 h-8 bg-gradient-to-br from-pink-400 to-rose-500 rounded-lg flex items-center justify-center text-white shadow-lg hover:shadow-pink-500/50 transition"
                                >
                                  📅
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center h-full"
                    >
                      <div className="text-center">
                        <motion.div
                          animate={{ 
                            rotate: [0, -10, 10, -10, 0],
                            scale: [1, 1.1, 1]
                          }}
                          transition={{ duration: 3, repeat: Infinity }}
                          className="text-7xl mb-4"
                        >
                          🔮
                        </motion.div>
                        <h3 className="text-xl font-bold text-pink-300 mb-2">
                          Ready to Search?
                        </h3>
                        <p className="text-purple-200/60 text-sm">
                          Enter criteria above and hit search
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Clinic-Based Grid Tab */}
          {viewTab === "clinic" && (
            <div>
              {/* Clinic Selector */}
              <div className="bg-stone-50 rounded-lg p-6 mb-6 border border-stone-200">
                <h3 className="text-lg font-semibold text-amber-900 mb-4">Select Clinic</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700 mb-2">Clinic</label>
                    <select
                      value={selectedClinicId}
                      onChange={(e) => handleClinicSelect(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent transition"
                    >
                      <option value="">Select a clinic</option>
                      {clinics.map(clinic => (
                        <option key={clinic.clinicId} value={clinic.clinicId}>
                          {clinic.clinicName} - {clinic.clinicCity}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Patients Grid */}
              {selectedClinicId ? (
                <div>
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-amber-900">
                      Patients at {clinics.find(c => c.clinicId === parseInt(selectedClinicId))?.clinicName}
                    </h3>
                    <p className="text-sm text-stone-600">
                      Total: <span className="font-semibold text-amber-700">{clinicPatients.length}</span> patient(s)
                    </p>
                  </div>

                  {clinicPatients.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {clinicPatients.map((patient) => (
                        <motion.div
                          key={patient.patientId}
                          whileHover={{ scale: 1.02, y: -4 }}
                          className="bg-white border-2 border-stone-200 rounded-lg p-6 shadow-md hover:shadow-xl hover:border-amber-300 transition-all"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-coral-400 to-peach-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                              {patient.firstName?.charAt(0) || patient.patientFirstName?.charAt(0)}{patient.lastName?.charAt(0) || patient.patientLastName?.charAt(0)}
                            </div>
                            <div>
                              <h4 className="text-lg font-bold text-amber-900">{patient.firstName || patient.patientFirstName} {patient.lastName || patient.patientLastName}</h4>
                              <p className="text-sm text-stone-500">ID: {patient.patientId}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-stone-600">DOB:</span>
                              <span className="font-medium text-stone-800">{patient.dateOfBirth || patient.patientDOB}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-600">Gender:</span>
                              <span className="font-medium text-stone-800">{patient.gender || patient.patientGender}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-600">Phone:</span>
                              <span className="font-medium text-stone-800">{patient.contactInfo?.primaryPhone || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-stone-600">Blood Type:</span>
                              <span className="font-medium text-stone-800">{patient.bloodType || patient.patientBloodType || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-stone-200 flex gap-2">
                            <button className="flex-1 px-3 py-2 bg-amber-100 text-amber-700 rounded-lg font-semibold hover:bg-amber-200 transition text-sm">
                              View Details
                            </button>
                            <button className="flex-1 px-3 py-2 bg-stone-100 text-stone-700 rounded-lg font-semibold hover:bg-stone-200 transition text-sm">
                              Edit
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
                      <p className="text-stone-500 text-lg">No patients registered at this clinic</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 bg-stone-50 rounded-lg border border-stone-200">
                  <p className="text-stone-500 text-lg">Please select a clinic to view patients</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Patient Details Modal */}
      <AnimatePresence>
        {showPatientModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowPatientModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full my-8 border-2 border-pink-400/70 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 px-8 py-5 border-b-2 border-pink-400/60">
                <div className="flex items-center justify-between">
                  <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-300/40 to-rose-400/40 border border-pink-300/60 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">🩺</span>
                      </div>
                      Patient Medical Record
                    </h2>
                    <p className="text-pink-100 text-xs mt-1 ml-13">
                      Complete profile and medical history
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPatientModal(false)}
                    className="text-white hover:bg-white/20 rounded-xl p-3 transition-all duration-200"
                    title="Close"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="px-8 py-6 max-h-[70vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c084fc transparent' }}>
                {loadingPatientDetails ? (
                  <div className="text-center py-20 bg-white rounded-2xl border-2 border-pink-400/50">
                    <div className="flex justify-center mb-6">
                      <motion.div
                        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="text-6xl"
                      >
                        🔮
                      </motion.div>
                    </div>
                    <p className="text-pink-200 text-lg font-semibold">Loading patient information...</p>
                    <p className="text-purple-300/60 text-sm mt-2">Please wait</p>
                  </div>
                ) : selectedPatient ? (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-indigo-400/50"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-indigo-400/50">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/40">
                          <span className="text-2xl">👤</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Basic Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-indigo-400/30">
                          <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-wide mb-2">👤 First Name</label>
                          <p className="text-base font-bold text-white">{selectedPatient?.patient?.patientFirstName || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-indigo-400/30">
                          <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-wide mb-2">👥 Last Name</label>
                          <p className="text-base font-bold text-white">{selectedPatient?.patient?.patientLastName || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-purple-400/30">
                          <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wide mb-2">🆔 Patient ID</label>
                          <p className="text-base font-bold text-white">{selectedPatient?.patient?.patientId || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-purple-400/30">
                          <label className="block text-[10px] font-bold text-purple-300 uppercase tracking-wide mb-2">🎂 Date of Birth</label>
                          <p className="text-base font-bold text-white">{selectedPatient?.patient?.patientDOB?.split('T')[0] || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-pink-400/30">
                          <label className="block text-[10px] font-bold text-pink-300 uppercase tracking-wide mb-2">⚧ Gender</label>
                          <p className="text-base font-bold text-white">{selectedPatient?.patient?.patientGender || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-rose-400/30">
                          <label className="block text-[10px] font-bold text-rose-300 uppercase tracking-wide mb-2">🩸 Blood Type</label>
                          <p className="text-base font-bold text-white">{selectedPatient?.patient?.patientBloodType || 'N/A'}</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Contact Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-purple-400/50"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-purple-400/50">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-400 via-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-pink-500/40">
                          <span className="text-2xl">📞</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Contact Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-purple-400/30">
                          <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">📱 Phone Number</label>
                          <p className="text-sm font-semibold text-white mt-2">{selectedPatient?.patientContact?.patientPhone || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-purple-400/30">
                          <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">📧 Email Address</label>
                          <p className="text-sm font-semibold text-white mt-2">{selectedPatient?.patientContact?.patientEmail || 'N/A'}</p>
                        </div>
                        <div className="md:col-span-2 bg-white p-4 rounded-xl border border-pink-400/30">
                          <label className="text-[10px] font-bold text-pink-300 uppercase tracking-wide">🏠 Address</label>
                          <p className="text-sm font-semibold text-white mt-2">{selectedPatient?.patientContact?.patientAddress || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-pink-400/30">
                          <label className="text-[10px] font-bold text-pink-300 uppercase tracking-wide">🌆 City</label>
                          <p className="text-sm font-semibold text-white mt-2">{selectedPatient?.patientContact?.patientCity || 'N/A'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-rose-400/30">
                          <label className="text-[10px] font-bold text-rose-300 uppercase tracking-wide">🚨 Emergency Contact</label>
                          <p className="text-sm font-semibold text-white mt-2">{selectedPatient?.patientContact?.patientEmergencyContact || 'N/A'}</p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Medical Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-400/50"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-pink-400/50">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-400 via-rose-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/40">
                          <span className="text-2xl">🏥</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Medical Information
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="bg-white p-4 rounded-xl border border-rose-400/30">
                          <label className="text-[10px] font-bold text-rose-300 uppercase tracking-wide">⚠️ Allergies</label>
                          <p className="text-xs text-white mt-2 whitespace-pre-wrap">{selectedPatient?.patientMedicalInfo?.patientAllergies || 'None reported'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-indigo-400/30">
                          <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">💊 Current Medications</label>
                          <p className="text-xs text-white mt-2 whitespace-pre-wrap">{selectedPatient?.patientMedicalInfo?.patientCurrentMedications || 'None'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-purple-400/30">
                          <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">🩺 Chronic Diseases</label>
                          <p className="text-xs text-white mt-2 whitespace-pre-wrap">{selectedPatient?.patientMedicalInfo?.chronicDiseases || 'None'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-pink-400/30">
                          <label className="text-[10px] font-bold text-pink-300 uppercase tracking-wide">👨‍⚕️ Primary Physician</label>
                          <p className="text-xs text-white mt-2">{selectedPatient?.patientMedicalInfo?.patientPrimaryPhysician || 'Not assigned'}</p>
                        </div>
                        <div className="md:col-span-2 bg-white p-4 rounded-xl border border-indigo-400/30">
                          <label className="text-[10px] font-bold text-indigo-300 uppercase tracking-wide">📋 Medical History</label>
                          <p className="text-xs text-white mt-2 whitespace-pre-wrap">{selectedPatient?.patientMedicalInfo?.medicalHistory || 'No history available'}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-purple-400/30">
                          <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">📊 Number of Visits</label>
                          <p className="text-2xl font-bold text-white mt-2">{selectedPatient?.patientMedicalInfo?.no_of_visits || 0}</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-pink-400/30">
                          <label className="text-[10px] font-bold text-pink-300 uppercase tracking-wide">📅 Last Visit</label>
                          <p className="text-sm font-semibold text-white mt-2">
                            {selectedPatient?.patientMedicalInfo?.lastVisitedDate?.split('T')[0] || 'Never'}
                          </p>
                        </div>
                      </div>
                    </motion.div>

                    {/* Insurance Information */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="bg-white rounded-2xl p-6 shadow-lg border-2 border-yellow-400/50"
                    >
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-yellow-400/50">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-400/40">
                          <span className="text-2xl">💳</span>
                        </div>
                        <h3 className="text-xl font-bold text-white">
                          Insurance Information
                        </h3>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-yellow-400/30">
                        <label className="text-[10px] font-bold text-yellow-300 uppercase tracking-wide">🏢 Insurance Provider</label>
                        <p className="text-base font-bold text-white mt-2">
                          {selectedPatient?.patientInsurance?.patientInsuranceProvider || 'No insurance on file'}
                        </p>
                      </div>
                    </motion.div>
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-lg border-2 border-red-200">
                    <div className="text-6xl mb-4">❌</div>
                    <p className="text-red-600 text-lg font-semibold">Unable to load patient information</p>
                  </div>
                )}
              </div>

              {/* Modal Footer with Action Buttons */}
              <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 px-8 py-5 flex justify-between items-center border-t-2 border-yellow-400/50">
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      openBookAppointment();
                      setShowPatientModal(false);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-yellow-400/60 hover:shadow-yellow-400/80 transition-all flex items-center gap-2 border-2 border-yellow-200"
                  >
                    <span className="text-lg">📅</span>
                    <span>Book Appointment</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      loadAppointmentHistory(selectedPatient?.patient?.patientId);
                      setShowPatientModal(false);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-blue-400/60 hover:shadow-blue-400/80 transition-all flex items-center gap-2 border-2 border-blue-200"
                  >
                    <span className="text-lg">📋</span>
                    <span>Appointment History</span>
                  </motion.button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPatientModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold hover:from-gray-600 hover:to-gray-700 transition shadow-lg"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Animated Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -100 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="fixed top-20 right-8 z-[99999] max-w-md"
          >
            <div className={`rounded-2xl shadow-2xl overflow-hidden ${
              popupConfig.type === 'error' ? 'bg-gradient-to-br from-red-500 via-pink-500 to-purple-500' :
              popupConfig.type === 'warning' ? 'bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400' :
              popupConfig.type === 'info' ? 'bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400' :
              'bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-400'
            }`}>
              <div className="p-6 relative">
                {/* Animated background elements */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"
                />
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    <motion.div
                      animate={{ 
                        rotate: [0, -10, 10, -10, 0],
                        scale: [1, 1.1, 1, 1.1, 1]
                      }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      className="text-5xl"
                    >
                      {popupConfig.emoji}
                    </motion.div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-xl mb-2">
                        {popupConfig.title}
                      </h3>
                      <p className="text-white/95 text-sm leading-relaxed">
                        {popupConfig.message}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPopup(false)}
                      className="text-white/80 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Progress bar */}
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 4, ease: "linear" }}
                    className="absolute bottom-0 left-0 h-1 bg-white/30"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Appointment History Modal */}
      <AnimatePresence>
        {showAppointmentHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => setShowAppointmentHistory(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.6 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full my-8 border-2 border-yellow-400/70 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 px-8 py-6 border-b-2 border-yellow-400/70">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 bg-gradient-to-br from-yellow-300/40 to-amber-400/50 border-2 border-yellow-300/70 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/40"
                    >
                      <span className="text-3xl">📋</span>
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Appointment History
                      </h2>
                      <p className="text-yellow-100 text-sm mt-1">
                        {selectedPatient?.patient?.patientFirstName} {selectedPatient?.patient?.patientLastName}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowAppointmentHistory(false)}
                    className="text-white hover:bg-white/20 rounded-xl p-3 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-6 max-h-[70vh] overflow-y-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" style={{ scrollbarWidth: 'thin', scrollbarColor: '#818cf8 transparent' }}>
                {loadingAppointments ? (
                  <div className="text-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="text-6xl mb-4"
                    >
                      ⏳
                    </motion.div>
                    <p className="text-blue-200 text-lg font-semibold">Loading appointments...</p>
                  </div>
                ) : appointments.length > 0 ? (
                  <div className="space-y-4">
                    {appointments.map((appt, index) => (
                      <motion.div
                        key={appt.appointmentId || index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white rounded-2xl p-6 border-2 border-yellow-400/30 hover:border-yellow-400/60 transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-400/40">
                                <span className="text-2xl">🗓️</span>
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-white">
                                  {appt.appointmentType || 'Consultation'}
                                </h3>
                                <p className="text-sm text-blue-200">
                                  {new Date(appt.appointmentDate).toLocaleDateString('en-US', { 
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                                  })}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                              <div className="bg-white p-3 rounded-xl border border-white/20">
                                <label className="text-[10px] font-bold text-yellow-300 uppercase tracking-wide">⏰ Time</label>
                                <p className="text-sm font-semibold text-white mt-1">
                                  {appt.startTime?.substring(0, 5) || 'N/A'} - {appt.endTime?.substring(0, 5) || 'N/A'}
                                </p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-white/20">
                                <label className="text-[10px] font-bold text-yellow-300 uppercase tracking-wide">⏱️ Duration</label>
                                <p className="text-sm font-semibold text-white mt-1">{appt.durationMinutes || 0} min</p>
                              </div>
                              <div className="bg-white p-3 rounded-xl border border-white/20">
                                <label className="text-[10px] font-bold text-yellow-300 uppercase tracking-wide">👨‍⚕️ Doctor</label>
                                <p className="text-sm font-semibold text-white mt-1">{appt.attendingPhysician || 'TBA'}</p>
                              </div>
                            </div>

                            {appt.reasonForVisit && (
                              <div className="bg-white p-3 rounded-xl border border-white/20 mb-3">
                                <label className="text-[10px] font-bold text-purple-300 uppercase tracking-wide">📝 Reason</label>
                                <p className="text-sm text-white mt-1">{appt.reasonForVisit}</p>
                              </div>
                            )}

                            {/* Status Badges - Highlighted */}
                            <div className="flex gap-2 flex-wrap">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg ${
                                  appt.status === 'Completed' ? 'bg-green-500/90 text-white border-2 border-green-300' :
                                  appt.status === 'Cancelled' ? 'bg-red-500/90 text-white border-2 border-red-300' :
                                  appt.status === 'NoShow' ? 'bg-orange-500/90 text-white border-2 border-orange-300' :
                                  'bg-blue-500/90 text-white border-2 border-blue-300'
                                }`}
                              >
                                <span>{appt.status === 'Completed' ? '✅' : appt.status === 'Cancelled' ? '❌' : appt.status === 'NoShow' ? '⚠️' : '🕐'}</span>
                                <span>{appt.status || 'Scheduled'}</span>
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-lg ${
                                  appt.paymentStatus === 'Paid' ? 'bg-emerald-500/90 text-white border-2 border-emerald-300' :
                                  appt.paymentStatus === 'Partial' ? 'bg-yellow-500/90 text-white border-2 border-yellow-300' :
                                  'bg-rose-500/90 text-white border-2 border-rose-300'
                                }`}
                              >
                                <span>{appt.paymentStatus === 'Paid' ? '💳' : appt.paymentStatus === 'Partial' ? '💰' : '⏳'}</span>
                                <span>{appt.paymentStatus || 'Pending'}</span>
                              </motion.div>

                              {appt.isConfirmed && (
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  className="px-4 py-2 rounded-full font-bold text-xs bg-cyan-500/90 text-white border-2 border-cyan-300 shadow-lg flex items-center gap-2"
                                >
                                  <span>✓</span>
                                  <span>Confirmed</span>
                                </motion.div>
                              )}
                            </div>

                            {(appt.paidAmount > 0 || appt.pendingAmount > 0) && (
                              <div className="mt-3 flex gap-3">
                                {appt.paidAmount > 0 && (
                                  <div className="bg-green-500/20 p-2 rounded-lg border border-green-400/30">
                                    <span className="text-[10px] font-bold text-green-300 uppercase">Paid: </span>
                                    <span className="text-sm font-bold text-white">${appt.paidAmount}</span>
                                  </div>
                                )}
                                {appt.pendingAmount > 0 && (
                                  <div className="bg-rose-500/20 p-2 rounded-lg border border-rose-400/30">
                                    <span className="text-[10px] font-bold text-rose-300 uppercase">Pending: </span>
                                    <span className="text-sm font-bold text-white">${appt.pendingAmount}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                            <motion.button
                              whileHover={{ scale: 1.05, rotate: 5 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setEditingAppointment(appt);
                                setAppointmentForm(appt);
                                setShowAppointmentHistory(false);
                                setShowBookAppointment(true);
                              }}
                              className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-xl font-bold shadow-lg hover:shadow-yellow-500/50 transition-all flex items-center gap-2"
                            >
                              <span>✏️</span>
                              <span>Edit</span>
                            </motion.button>
                          </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">📭</div>
                    <p className="text-white text-lg font-semibold">No appointments found</p>
                    <p className="text-blue-300 text-sm mt-2">This patient has no appointment history yet.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 px-8 py-4 flex justify-end border-t-2 border-yellow-400/50">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAppointmentHistory(false)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold shadow-lg"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Book Appointment Modal */}
      <AnimatePresence>
        {showBookAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={() => {
              setShowBookAppointment(false);
              setEditingAppointment(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", duration: 0.6 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-8 border-2 border-yellow-400/70 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-yellow-200 via-amber-300 to-orange-400 px-8 py-6 border-b-2 border-yellow-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 bg-white/30 border-2 border-white/50 rounded-2xl flex items-center justify-center shadow-lg"
                    >
                      <span className="text-3xl">📅</span>
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        {editingAppointment ? 'Edit Appointment' : 'Book New Appointment'}
                      </h2>
                      <p className="text-white/90 text-sm mt-1">
                        {appointmentForm.firstName} {appointmentForm.lastName}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setShowBookAppointment(false);
                      setEditingAppointment(null);
                    }}
                    className="text-white hover:bg-white/20 rounded-xl p-3 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Form Content */}
              <div className="px-8 py-6 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#818cf8 transparent' }}>
                <div className="space-y-4">
                  {/* Clinic ID and Enterprise ID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-emerald-600 uppercase tracking-wide mb-2">🏥 Clinic ID</label>
                      <input
                        type="text"
                        value={appointmentForm.clinicId || ''}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 border-2 border-emerald-300 rounded-xl text-gray-900 font-bold cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-purple-600 uppercase tracking-wide mb-2">🏬 Enterprise ID</label>
                      <input
                        type="text"
                        value={appointmentForm.enterpriseId || ''}
                        readOnly
                        className="w-full px-4 py-3 bg-gray-100 border-2 border-purple-300 rounded-xl text-gray-900 font-bold cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Patient Search or Walk-in Fields */}
                  {appointmentForm.appointmentType === 'Walkin' ? (
                    <div className="space-y-4">
                      <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                        <h3 className="text-lg font-bold text-orange-700 mb-3">🚶 Walk-in Patient Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-bold text-blue-600 uppercase tracking-wide mb-2">👤 First Name</label>
                            <input
                              type="text"
                              value={appointmentForm.firstName || ''}
                              onChange={(e) => setAppointmentForm({ ...appointmentForm, firstName: e.target.value })}
                              placeholder="Enter first name"
                              className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-indigo-600 uppercase tracking-wide mb-2">👤 Last Name</label>
                            <input
                              type="text"
                              value={appointmentForm.lastName || ''}
                              onChange={(e) => setAppointmentForm({ ...appointmentForm, lastName: e.target.value })}
                              placeholder="Enter last name"
                              className="w-full px-4 py-3 bg-white border-2 border-indigo-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-pink-600 uppercase tracking-wide mb-2">🎂 Date of Birth</label>
                            <input
                              type="date"
                              value={appointmentForm.dateOfBirth || ''}
                              onChange={(e) => setAppointmentForm({ ...appointmentForm, dateOfBirth: e.target.value })}
                              className="w-full px-4 py-3 bg-white border-2 border-pink-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition shadow-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-teal-600 uppercase tracking-wide mb-2">📞 Contact Number</label>
                            <input
                              type="tel"
                              value={appointmentForm.phoneNumber || ''}
                              onChange={(e) => setAppointmentForm({ ...appointmentForm, phoneNumber: e.target.value })}
                              placeholder="Enter mobile number"
                              className="w-full px-4 py-3 bg-white border-2 border-teal-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative">
                      <label className="block text-sm font-bold text-blue-600 uppercase tracking-wide mb-2">🔍 Search Patient</label>
                      <input
                        type="text"
                        value={patientSearchTerm}
                        onChange={(e) => handlePatientSearch(e.target.value)}
                        onFocus={() => patientSearchTerm && setShowPatientDropdown(true)}
                        placeholder="Type first or last name..."
                        className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                      />
                      {/* Patient Dropdown */}
                      {showPatientDropdown && filteredPatientsForBooking.length > 0 && (
                        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-blue-300 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                          {filteredPatientsForBooking.map((patient) => (
                            <div
                              key={patient.patientId}
                              onClick={() => handleSelectPatientForBooking(patient)}
                              className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-blue-100 last:border-b-0 transition"
                            >
                              <p className="font-bold text-gray-900">{patient.firstName} {patient.lastName}</p>
                              <p className="text-xs text-gray-600">ID: {patient.patientId}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Date and Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-blue-600 uppercase tracking-wide mb-2">📅 Appointment Date</label>
                      <input
                        type="date"
                        value={appointmentForm.appointmentDate || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentDate: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-indigo-600 uppercase tracking-wide mb-2">🕐 Start Time</label>
                      <input
                        type="time"
                        value={appointmentForm.startTime || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, startTime: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-indigo-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-purple-600 uppercase tracking-wide mb-2">🕑 End Time</label>
                      <input
                        type="time"
                        value={appointmentForm.endTime || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, endTime: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-pink-600 uppercase tracking-wide mb-2">⏱️ Duration (min)</label>
                      <input
                        type="number"
                        value={appointmentForm.durationMinutes || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, durationMinutes: parseInt(e.target.value) })}
                        className="w-full px-4 py-3 bg-white border-2 border-pink-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 transition shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Appointment Type and Doctor */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-teal-600 uppercase tracking-wide mb-2">🩺 Appointment Type</label>
                      <select
                        value={appointmentForm.appointmentType || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, appointmentType: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-teal-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition shadow-sm"
                      >
                        <option value="Appointment">Appointment</option>
                        <option value="Walkin">Walk-in</option>
                        <option value="Consultation">Consultation</option>
                        <option value="Follow-up">Follow-up</option>
                        <option value="Checkup">Checkup</option>
                        <option value="Treatment">Treatment</option>
                        <option value="Emergency">Emergency</option>
                        <option value="Telehealth">Telehealth</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-cyan-600 uppercase tracking-wide mb-2">👨‍⚕️ Attending Physician</label>
                      <select
                        value={appointmentForm.attendingPhysician || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, attendingPhysician: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-cyan-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition shadow-sm"
                      >
                        <option value="">Select a doctor...</option>
                        {loadingDoctors ? (
                          <option value="" disabled>Loading doctors...</option>
                        ) : doctorsList.length > 0 ? (
                          doctorsList.map((doctor) => (
                            <option key={doctor.doctorId} value={doctor.doctorName || doctor.staffFirstName + ' ' + doctor.staffLastName}>
                              Dr. {doctor.doctorName || doctor.staffFirstName + ' ' + doctor.staffLastName}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No doctors found for this clinic</option>
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Reason for Visit */}
                  <div>
                    <label className="block text-sm font-bold text-indigo-600 uppercase tracking-wide mb-2">📝 Reason for Visit</label>
                    <textarea
                      value={appointmentForm.reasonForVisit || ''}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, reasonForVisit: e.target.value })}
                      placeholder="Describe the reason for this appointment..."
                      rows={3}
                      className="w-full px-4 py-3 bg-white border-2 border-indigo-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition shadow-sm resize-none"
                    />
                  </div>

                  {/* Status and Payment */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-blue-600 uppercase tracking-wide mb-2">📊 Status</label>
                      <select
                        value={appointmentForm.status || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, status: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-blue-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
                      >
                        <option value="Scheduled">Scheduled</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="NoShow">No Show</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-purple-600 uppercase tracking-wide mb-2">💳 Payment Status</label>
                      <select
                        value={appointmentForm.paymentStatus || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, paymentStatus: e.target.value })}
                        className="w-full px-4 py-3 bg-white border-2 border-purple-300 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition shadow-sm"
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Partial">Partial</option>
                        <option value="Invoice">Invoice</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer bg-white/90 px-3 py-3 rounded-xl border-2 border-emerald-300 shadow-sm hover:bg-white transition">
                        <input
                          type="checkbox"
                          checked={appointmentForm.isConfirmed || false}
                          onChange={(e) => setAppointmentForm({ ...appointmentForm, isConfirmed: e.target.checked })}
                          className="w-5 h-5 rounded border-2 border-emerald-400 text-emerald-600 focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-sm font-bold text-emerald-700 uppercase">✓ Confirmed</span>
                      </label>
                    </div>
                  </div>

                  {/* Payment Amounts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-green-600 uppercase tracking-wide mb-2">💵 Paid Amount</label>
                      <input
                        type="number"
                        value={appointmentForm.paidAmount || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, paidAmount: parseFloat(e.target.value) })}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full px-4 py-3 bg-white border-2 border-green-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-orange-600 uppercase tracking-wide mb-2">⏳ Pending Amount</label>
                      <input
                        type="number"
                        value={appointmentForm.pendingAmount || ''}
                        onChange={(e) => setAppointmentForm({ ...appointmentForm, pendingAmount: parseFloat(e.target.value) })}
                        placeholder="0.00"
                        step="0.01"
                        className="w-full px-4 py-3 bg-white border-2 border-orange-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition shadow-sm"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">📄 Additional Notes</label>
                    <textarea
                      value={appointmentForm.notes || ''}
                      onChange={(e) => setAppointmentForm({ ...appointmentForm, notes: e.target.value })}
                      placeholder="Any additional notes or instructions..."
                      rows={2}
                      className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition shadow-sm resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 px-8 py-5 flex justify-end gap-3 border-t-2 border-yellow-400/50">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowBookAppointment(false);
                    setEditingAppointment(null);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold shadow-lg"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveAppointment}
                  className="px-8 py-3 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-blue-400/60 hover:shadow-blue-400/80 transition-all border-2 border-blue-200"
                >
                  {editingAppointment ? '💾 Save Changes' : '✨ Book Appointment'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagnosis Details Modal */}
      <AnimatePresence>
        {showDiagnosisModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="modal-backdrop fixed inset-0 bg-black/30 flex items-center justify-center z-[9999] p-4 print:block print:static print:bg-white print:p-0"
            onClick={() => setShowDiagnosisModal(false)}
            style={{ overflow: 'auto' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="print-modal-content bg-white rounded-3xl shadow-2xl max-w-5xl w-full my-8 border-2 border-yellow-400/70 overflow-hidden print:rounded-none print:shadow-none print:max-w-none print:w-full print:my-0 print:border-none"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 px-8 py-6 border-b-2 border-yellow-400/70 print:hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-14 h-14 bg-gradient-to-br from-yellow-300/40 to-amber-400/50 border-2 border-yellow-300/70 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-400/40"
                    >
                      <span className="text-3xl">🩺</span>
                    </motion.div>
                    <div>
                      <h2 className="text-2xl font-bold text-white tracking-tight">
                        Diagnosis & Prescription
                      </h2>
                      <p className="text-yellow-100 text-sm mt-1">
                        View & Print Complete Report
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowDiagnosisModal(false)}
                    className="text-white hover:bg-white/20 rounded-xl p-3 transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>

              {/* Content */}
              <div className="px-8 py-6 max-h-[70vh] overflow-y-auto bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 print:max-h-none print:overflow-visible print:bg-white print:px-0 print:py-0" style={{ scrollbarWidth: 'thin', scrollbarColor: '#818cf8 transparent' }}>
                {loadingDiagnosis ? (
                  <div className="text-center py-20">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="text-6xl mb-4"
                    >
                      ⏳
                    </motion.div>
                    <p className="text-indigo-700 text-lg font-semibold">Loading diagnosis details...</p>
                  </div>
                ) : selectedDiagnosis ? (
                  <div className="space-y-6 print:space-y-4">
                    {/* ============ PRINT OPTIONS - ALWAYS VISIBLE AT TOP ============ */}
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="sticky top-0 z-10 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 border-3 border-amber-500 rounded-2xl p-6 shadow-xl print:hidden"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">🖨️</span>
                        <h4 className="text-xl font-bold text-amber-900">PRINT PRESCRIPTION</h4>
                      </div>
                      <p className="text-sm text-amber-800 mb-4 font-semibold">Choose your printing method:</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Method 1 - New Window */}
                        <motion.button
                          whileHover={{ scale: 1.08, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => printPrescriptionNewWindow()}
                          className="px-5 py-4 bg-gradient-to-br from-green-400 to-emerald-600 hover:from-green-500 hover:to-emerald-700 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-3 border-2 border-green-300"
                        >
                          <span className="text-2xl">✨</span>
                          <div className="text-left">
                            <div className="font-bold text-sm">New Window</div>
                            <div className="text-xs opacity-90">Clean & Professional</div>
                          </div>
                        </motion.button>

                        {/* Method 2 - Modal Print */}
                        <motion.button
                          whileHover={{ scale: 1.08, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => printPrescriptionModal()}
                          className="px-5 py-4 bg-gradient-to-br from-blue-400 to-indigo-600 hover:from-blue-500 hover:to-indigo-700 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-3 border-2 border-blue-300"
                        >
                          <span className="text-2xl">📄</span>
                          <div className="text-left">
                            <div className="font-bold text-sm">Modal Print</div>
                            <div className="text-xs opacity-90">From Modal</div>
                          </div>
                        </motion.button>

                        {/* Method 3 - Hidden Div */}
                        <motion.button
                          whileHover={{ scale: 1.08, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => printPrescriptionHidden()}
                          className="px-5 py-4 bg-gradient-to-br from-purple-400 to-pink-600 hover:from-purple-500 hover:to-pink-700 text-white rounded-xl font-bold shadow-xl hover:shadow-2xl transition flex items-center justify-center gap-3 border-2 border-purple-300"
                        >
                          <span className="text-2xl">🎯</span>
                          <div className="text-left">
                            <div className="font-bold text-sm">Hidden Div</div>
                            <div className="text-xs opacity-90">Alternative</div>
                          </div>
                        </motion.button>
                      </div>
                      <div className="mt-4 p-3 bg-white/70 rounded-lg border border-amber-300">
                        <p className="text-xs text-amber-900">💡 <strong>Tip:</strong> Try "New Window" first - it's the most reliable method for printing prescriptions!</p>
                      </div>
                    </motion.div>

                    {/* Patient & Doctor Info Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl p-5 border-2 border-blue-400 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-blue-400">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl">👤</span>
                          </div>
                          <h3 className="text-lg font-bold text-blue-900">Patient Information</h3>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-semibold text-blue-700 uppercase">Name</label>
                            <p className="text-base font-bold text-gray-900">{selectedDiagnosis.patientName || 'N/A'}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs font-semibold text-blue-700 uppercase">Patient ID</label>
                              <p className="text-sm font-semibold text-gray-800">{selectedDiagnosis.patientId || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-blue-700 uppercase">Clinic ID</label>
                              <p className="text-sm font-semibold text-gray-800">{selectedDiagnosis.clinicId || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-2xl p-5 border-2 border-purple-400 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-purple-400">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl">👨‍⚕️</span>
                          </div>
                          <h3 className="text-lg font-bold text-purple-900">Doctor Information</h3>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <label className="text-xs font-semibold text-purple-700 uppercase">Attending Physician</label>
                            <p className="text-base font-bold text-gray-900">{selectedDiagnosis.attendingPhysician || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-purple-700 uppercase">Visit Date</label>
                            <p className="text-sm font-semibold text-gray-800">
                              {selectedDiagnosis.visitDate ? new Date(selectedDiagnosis.visitDate).toLocaleDateString('en-US', { 
                                year: 'numeric', month: 'long', day: 'numeric' 
                              }) : 'N/A'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    {/* Visit Details */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-2xl p-5 border-2 border-yellow-400 shadow-md"
                    >
                      <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-yellow-400">
                        <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl flex items-center justify-center">
                          <span className="text-xl">📋</span>
                        </div>
                        <h3 className="text-lg font-bold text-yellow-900">Visit Details</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedDiagnosis.nextAppointmentDate && (
                          <div className="bg-white p-3 rounded-xl border border-yellow-400">
                            <label className="text-xs font-semibold text-yellow-700 uppercase">📅 Next Appointment</label>
                            <p className="text-sm font-bold text-gray-900 mt-1">
                              {new Date(selectedDiagnosis.nextAppointmentDate).toLocaleDateString('en-US', { 
                                month: 'short', day: 'numeric', year: 'numeric' 
                              })}
                            </p>
                          </div>
                        )}
                        <div className="bg-white p-3 rounded-xl border border-amber-400">
                          <label className="text-xs font-semibold text-amber-700 uppercase">💰 Payment Status</label>
                          <p className="text-sm font-bold text-gray-900 mt-1">{selectedDiagnosis.paymentStatus || 'Pending'}</p>
                        </div>
                        {selectedDiagnosis.billingAmount && (
                          <div className="bg-white p-3 rounded-xl border border-green-400">
                            <label className="text-xs font-semibold text-green-700 uppercase">💵 Amount</label>
                            <p className="text-sm font-bold text-gray-900 mt-1">₹{selectedDiagnosis.billingAmount}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>

                    {/* Reason for Visit */}
                    {selectedDiagnosis.reasonForVisit && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-2xl p-5 border-2 border-cyan-400 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-cyan-400">
                          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl">📝</span>
                          </div>
                          <h3 className="text-base font-bold text-cyan-900">Reason for Visit</h3>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedDiagnosis.reasonForVisit}
                        </p>
                      </motion.div>
                    )}

                    {/* Diagnosis */}
                    {selectedDiagnosis.diagnoses && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl p-5 border-2 border-indigo-400 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-indigo-400">
                          <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl">🩺</span>
                          </div>
                          <h3 className="text-base font-bold text-indigo-900">Diagnosis</h3>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedDiagnosis.diagnoses}
                        </p>
                      </motion.div>
                    )}

                    {/* Treatments */}
                    {selectedDiagnosis.treatments && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl p-5 border-2 border-green-400 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-green-400">
                          <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl">💉</span>
                          </div>
                          <h3 className="text-base font-bold text-green-900">Treatments Provided</h3>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedDiagnosis.treatments}
                        </p>
                      </motion.div>
                    )}

                    {/* Prescriptions Grid - With Data */}
                    {selectedDiagnosis.prescriptions && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl p-6 shadow-lg border-2 border-pink-400"
                      >
                        {(() => {
                          try {
                            const prescriptionData = typeof selectedDiagnosis.prescriptions === 'string' 
                              ? JSON.parse(selectedDiagnosis.prescriptions) 
                              : selectedDiagnosis.prescriptions;
                            
                            if (Array.isArray(prescriptionData) && prescriptionData.length > 0) {
                              return (
                                <div className="space-y-5">
                                  {/* Prescription Header */}
                                  <div className="flex items-center pb-4 border-b-3 border-pink-300">
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-2xl">💊</span>
                                      </div>
                                      <h3 className="text-xl font-bold text-gray-900">Prescription Details</h3>
                                    </div>
                                  </div>

                                  {/* Medications Grid */}
                                  <div>
                                    <h4 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                                      <span>💊</span> Prescribed Medications
                                    </h4>
                                    
                                    {/* Grid Header */}
                                    <div style={{
                                      display: 'grid',
                                      gridTemplateColumns: '40px 1fr 80px 80px 100px',
                                      gap: '8px',
                                      backgroundColor: '#1f2937',
                                      color: 'white',
                                      padding: '12px',
                                      borderRadius: '8px 8px 0 0',
                                      fontWeight: 'bold',
                                      fontSize: '12px',
                                      textAlign: 'center'
                                    }}>
                                      <div>#</div>
                                      <div style={{ textAlign: 'left' }}>Medicine Name</div>
                                      <div>Dosage</div>
                                      <div>Frequency</div>
                                      <div>Duration</div>
                                    </div>
                                    
                                    {/* Grid Rows */}
                                    <div style={{
                                      border: '2px solid #d1d5db',
                                      borderRadius: '0 0 8px 8px',
                                      overflow: 'hidden'
                                    }}>
                                      {prescriptionData.map((med, idx) => (
                                        <div key={idx}>
                                          <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '40px 1fr 80px 80px 100px',
                                            gap: '8px',
                                            padding: '12px',
                                            fontSize: '12px',
                                            borderBottom: '1px solid #e5e7eb',
                                            backgroundColor: idx % 2 === 0 ? '#fce7f3' : 'white',
                                            textAlign: 'center'
                                          }}>
                                            <div style={{ fontWeight: 'bold', color: '#be123c' }}>{idx + 1}</div>
                                            <div style={{ fontWeight: 'bold', color: '#111827', textAlign: 'left' }}>{med.medicineName || 'N/A'}</div>
                                            <div style={{ color: '#374151' }}>{med.dosage || '-'}</div>
                                            <div style={{ color: '#374151' }}>{med.frequency || '-'}</div>
                                            <div style={{ color: '#374151' }}>{med.duration || '-'}</div>
                                          </div>
                                          {med.specialInstructions && (
                                            <div style={{
                                              padding: '8px 12px',
                                              backgroundColor: '#fef3c7',
                                              borderBottom: '1px solid #fcd34d',
                                              fontSize: '12px'
                                            }}>
                                              <span style={{ fontWeight: 'bold', color: '#92400e' }}>⚠️ Special Instructions: </span>
                                              <span style={{ color: '#78350f' }}>{med.specialInstructions}</span>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* General Notes */}
                                    {prescriptionData[0]?.generalPrescriptionNotes && (
                                      <div className="mt-4 p-4 bg-white rounded-xl border-2 border-indigo-400">
                                        <span className="text-indigo-900 font-bold text-sm">📝 General Instructions: </span>
                                        <p className="text-gray-800 text-sm mt-2">{prescriptionData[0].generalPrescriptionNotes}</p>
                                      </div>
                                    )}
                                  </div>

                                  {/* Footer Note */}
                                  <div className="pt-4 border-t-2 border-yellow-400 text-center">
                                    <p className="text-xs text-gray-600">⚕️ This prescription is valid for 90 days from the date of issue.</p>
                                  </div>
                                </div>
                              );
                            }
                          } catch (e) {
                            console.error('Error parsing prescription:', e);
                          }
                          return (
                            <div className="flex items-center gap-3 pb-3 border-b-2 border-pink-300">
                              <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-rose-500 rounded-xl flex items-center justify-center">
                                <span className="text-xl">💊</span>
                              </div>
                              <h3 className="text-base font-bold text-pink-900">Prescription Notes</h3>
                              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap mt-3">
                                {selectedDiagnosis.prescriptions}
                              </p>
                            </div>
                          );
                        })()}
                      </motion.div>
                    )}

                    {/* Notes */}
                    {selectedDiagnosis.notes && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-2xl p-5 border-2 border-orange-400 shadow-md"
                      >
                        <div className="flex items-center gap-3 mb-3 pb-3 border-b-2 border-orange-400">
                          <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center">
                            <span className="text-xl">📄</span>
                          </div>
                          <h3 className="text-base font-bold text-orange-900">Additional Notes</h3>
                        </div>
                        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
                          {selectedDiagnosis.notes}
                        </p>
                      </motion.div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="text-6xl mb-4">❌</div>
                    <p className="text-gray-700 text-lg font-semibold">No diagnosis details found</p>
                    <p className="text-gray-500 text-sm mt-2">This appointment may not have diagnosis information yet.</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-blue-100 via-indigo-100 to-purple-100 px-8 py-4 flex justify-end border-t-2 border-yellow-400/50 print:hidden">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowDiagnosisModal(false)}
                  className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition"
                >
                  Close
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



