import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { listInventoryMasters, createInventoryMaster } from "../services/inventoryService";
import { addPrescription } from "../services/appointmentService";
import PrescriptionEmailTemplate from "./PrescriptionEmailTemplate";
import InventoryAutoComplete from "./InventoryAutoComplete";

const PrescriptionWritingModal = ({
  isOpen,
  onClose,
  patientInfo,
  medicalHistory,
  doctorInfo,
  appointmentId,
  appointmentDetails,
  onSavePrescription
}) => {
  const [medications, setMedications] = useState([
    { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
  ]);
  const [inventoryMeds, setInventoryMeds] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [showAddMedModal, setShowAddMedModal] = useState(false);
  const [newMedicationForm, setNewMedicationForm] = useState({
    itemName: "",
    itemCode: "",
    category: "Medicines",
    subCategory: "General",
    unit: "tablet",
    isActive: true
  });
  const [savingPrescription, setSavingPrescription] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [medicationToAdd, setMedicationToAdd] = useState(null);

  const categoryOptions = {
    Medicines: ["General", "Antibiotic", "Analgesic", "Anti-inflammatory", "Steroid", "Antiseptic"],
    Consumables: ["Gloves", "Masks", "Syringes", "Cotton", "Gauze"],
    Equipment: ["Small Equipment", "Device", "Accessory"],
    Supplements: ["Vitamin", "Mineral", "Herbal"],
    Other: ["General", "Custom"]
  };

  // Load medications from inventory
  useEffect(() => {
    if (isOpen) {
      loadInventoryMedications();
    }
  }, [isOpen]);
  const loadInventoryMedications = async () => {
    setLoadingMeds(true);
    try {
      const data = await listInventoryMasters();
      setInventoryMeds(data || []);
    } catch (error) {
      console.error("Failed to load medications:", error);
      setInventoryMeds([]);
    } finally {
      setLoadingMeds(false);
    }
  };

  const handleAddMedicationRow = () => {
    setMedications([
      ...medications,
      { name: "", dosage: "", frequency: "", duration: "", instructions: "" }
    ]);
  };

  const handleRemoveMedicationRow = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  const handleMedicationChange = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;
    setMedications(updated);
  };

  const handleOpenAddMedication = (index) => {
    setMedicationToAdd(index);
    setShowAddMedModal(true);
  };

  const handleSaveNewMedication = async () => {
    if (!newMedicationForm.itemName || !newMedicationForm.itemCode || !newMedicationForm.category || !newMedicationForm.unit) {
      alert("❌ Please fill medication name, code, category, and unit.");
      return;
    }

    try {
      const newMed = await createInventoryMaster({
        itemName: newMedicationForm.itemName,
        itemCode: newMedicationForm.itemCode,
        category: newMedicationForm.category,
        subCategory: newMedicationForm.subCategory,
        unit: newMedicationForm.unit,
        isActive: newMedicationForm.isActive
      });

      // Refresh dropdown with latest list and add the new med locally for immediate availability
      setInventoryMeds(prev => [...prev, newMed]);
      await loadInventoryMedications();

      // Select the new medication
      if (medicationToAdd !== null) {
        const updated = [...medications];
        updated[medicationToAdd].name = newMed.itemName;
        setMedications(updated);
      }

      // Success message
      alert("🎉 Medication added to inventory successfully! You're awesome!");
      
      // Reset form
      setNewMedicationForm({
        itemName: "",
        itemCode: "",
        category: "Medicines",
        subCategory: "General",
        unit: "tablet",
        isActive: true
      });
      setShowAddMedModal(false);
      setMedicationToAdd(null);
    } catch (error) {
      console.error("Failed to add medication:", error);
      alert("❌ Failed to add medication. Please try again.");
    }
  };

  const handleSavePrescription = async () => {
    // Validate medications
    const validMeds = medications.filter(med => med.name && med.dosage && med.frequency && med.duration);
    if (validMeds.length === 0) {
      alert("❌ Please add at least one medication with all details");
      return;
    }

    setSavingPrescription(true);
    try {
      // Log all available data
      const selectedAccess = JSON.parse(localStorage.getItem("selectedAccess") || "{}");
      const userData = JSON.parse(localStorage.getItem("userData") || "{}");
      
      console.log('🔍 ============ AVAILABLE DATA ============');
      console.log('📦 Props received:');
      console.log('  patientInfo:', patientInfo);
      console.log('  appointmentDetails:', appointmentDetails);
      console.log('  appointmentId (prop):', appointmentId);
      console.log('  doctorInfo:', doctorInfo);
      console.log('📦 LocalStorage:');
      console.log('  selectedAccess:', selectedAccess);
      console.log('  userData:', userData);
      
      // Extract IDs from all available sources
      const enterpriseId = parseInt(
        appointmentDetails?.enterpriseId || 
        selectedAccess.enterpriseId || 
        0
      );
      const clinicId = parseInt(
        appointmentDetails?.clinicId || 
        selectedAccess.clinicId || 
        0
      );
      const appointmentIdNum = parseInt(
        appointmentDetails?.appointmentId || 
        appointmentId || 
        0
      );
      const doctorId = parseInt(
        appointmentDetails?.doctorId || 
        doctorInfo?.doctorId || 
        0
      );
      const patientId = parseInt(
        appointmentDetails?.patientId || 
        patientInfo?.patientId || 
        0
      );
      const visitId = parseInt(
        appointmentDetails?.visitId || 
        0
      );
      
      console.log('📋 ============ EXTRACTED IDS ============');
      console.log('  enterpriseId:', enterpriseId);
      console.log('  clinicId:', clinicId);
      console.log('  appointmentId:', appointmentIdNum);
      console.log('  doctorId:', doctorId);
      console.log('  patientId:', patientId);
      console.log('  visitId:', visitId);
      
      // Validate all IDs are non-zero
      const missingIds = [];
      if (enterpriseId === 0) missingIds.push('enterpriseId');
      if (clinicId === 0) missingIds.push('clinicId');
      if (appointmentIdNum === 0) missingIds.push('appointmentId');
      if (doctorId === 0) missingIds.push('doctorId');
      if (patientId === 0) missingIds.push('patientId');
      
      if (missingIds.length > 0) {
        console.error('❌ MISSING REQUIRED IDS:', missingIds);
        alert(`❌ Cannot save prescription - Missing: ${missingIds.join(', ')}\n\nCheck browser console for DEBUG data.`);
        setSavingPrescription(false);
        return;
      }
      
      // Save each medication as a separate prescription record
      for (const med of validMeds) {
        const now = new Date().toISOString();
        
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
        
        console.log('📤 Sending payload for medication:', med.name);
        console.log('Payload:', payload);
        
        try {
          const result = await addPrescription(payload);
          console.log('✅ Prescription saved:', result);
          savedPrescriptions.push(result);
        } catch (apiError) {
          console.error('❌ Failed to save individual prescription:', {
            medication: med.name,
            error: apiError,
            payload: payload
          });
          throw apiError;
        }
      }

      // Show success popup with funny message
      const funnyMessages = [
        "🎉 Your prescription is now in the system! The medications are ready to fight the germs!",
        "💊 Success! Those medications are now officially documented. Science wins again!",
        "✅ Prescription saved! Your patient's bacteria have officially been put on notice!",
        "🏥 Boom! Prescription added to the Hall of Medical Fame!",
        "📋 Done! Your prescription is now part of the permanent record. No takebacks!",
        "💉 Nailed it! Your prescription is saved and looking fabulous!",
        "🎯 Prescription saved with surgical precision! Well done, doctor!",
        "🚀 Prescription has entered the system at warp speed! Houston, we have medications!"
      ];
      
      const funnyMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      
      // Call parent callback to handle success
      await onSavePrescription({
        appointmentId,
        patientId: patientInfo.patientId,
        doctorId: doctorInfo.doctorId || userData.doctorId || 0,
        doctorName: doctorInfo.doctorName || userData.username || "Doctor",
        doctorRegistrationNumber: doctorInfo.registrationNumber || "",
        prescriptionDate: new Date().toISOString().split('T')[0],
        prescriptionContent: validMeds
          .map(med => `${med.name} - ${med.dosage} ${med.frequency} for ${med.duration}${med.instructions ? ` (${med.instructions})` : ""}`)
          .join("\n"),
        successMessage: funnyMessage,
        medicationsSaved: savedPrescriptions
      });

      alert(funnyMessage);
      onClose();
    } catch (error) {
      console.error("Failed to save prescription:", error);
      
      // Extract detailed error information
      let errorMessage = "Failed to save prescription";
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Check if it's a 400 Bad Request error
        if (errorMessage.includes("400")) {
          console.error('❌ 400 BAD REQUEST - Backend rejected the payload');
          console.error('   Possible causes:');
          console.error('   1. Payload structure incorrect');
          console.error('   2. Field types don\'t match (e.g., string vs number)');
          console.error('   3. Required fields missing');
          console.error('   4. Field naming different (PascalCase vs camelCase)');
          console.error('   Please check the console logs above for the exact payload sent');
        }
      }
      
      alert(`❌ ${errorMessage}`);
    } finally {
      setSavingPrescription(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      setSendingEmail(true);
      
      // ===== COMPREHENSIVE LOGGING =====
      console.log('🔍 ===== PRESCRIPTION EMAIL SEND CALLED =====');
      console.log('📋 Full patientInfo object:', patientInfo);
      console.log('📧 patientInfo?.patientEmail:', patientInfo?.patientEmail);
      console.log('📧 patientInfo?.email:', patientInfo?.email);
      console.log('📧 patientInfo?.patientContact:', patientInfo?.patientContact);
      console.log('📧 patientInfo?.patientContact?.patientEmail:', patientInfo?.patientContact?.patientEmail);
      
      // Validate email exists with multiple fallback options
      const patientEmail = (patientInfo?.patientContact?.patientEmail 
        || patientInfo?.patientEmail 
        || patientInfo?.email 
        || '').trim() ? 
        (patientInfo?.patientContact?.patientEmail 
          || patientInfo?.patientEmail 
          || patientInfo?.email).trim()
        : 'srivatchu94@gmail.com';
      
      console.log('✅ Final patientEmail being used for prescription:', patientEmail);
      
      if (!patientEmail || patientEmail === 'srivatchu94@gmail.com') {
        console.warn('⚠️ Using fallback email: srivatchu94@gmail.com');
      }
      
      // Validate medications
      const validMeds = medications.filter(med => med.name && med.dosage && med.frequency && med.duration);
      if (validMeds.length === 0) {
        alert("❌ Please add at least one medication before sending email");
        setSendingEmail(false);
        return;
      }
      
      // Create prescription object for email
      const prescriptionForEmail = {
        prescriptionId: appointmentDetails?.prescriptionId || "N/A",
        prescriptionDate: new Date().toISOString(),
        prescriptionContent: validMeds
          .map(med => `${med.name} - ${med.dosage} ${med.frequency} for ${med.duration}${med.instructions ? ` (${med.instructions})` : ""}`)
          .join("\n"),
        medicationsList: validMeds
      };

      // Ensure complete doctor info - extract from multiple sources
      const completeDoctorInfo = {
        doctorId: doctorInfo?.doctorId || appointmentDetails?.doctorId || userData?.doctorId,
        doctorName: doctorInfo?.doctorName || doctorInfo?.doctor_name || appointmentDetails?.doctorName || userData?.username || "Dr. Physician",
        specialization: doctorInfo?.specialization || doctorInfo?.specialty || appointmentDetails?.specialty || "General Dentistry",
        registrationNumber: doctorInfo?.registrationNumber || doctorInfo?.registration_number || appointmentDetails?.registrationNumber || "LIC-001",
        clinicName: doctorInfo?.clinicName || appointmentDetails?.clinicName || "Dental Clinic",
        clinicAddress: doctorInfo?.clinicAddress || appointmentDetails?.address || "Clinic Address",
        clinicPhone: doctorInfo?.clinicPhone || appointmentDetails?.phone || "Contact"
      };

      // Ensure complete clinic info
      const completeClinicInfo = {
        clinicName: appointmentDetails?.clinicName || completeDoctorInfo.clinicName || "Dental Clinic",
        address: appointmentDetails?.address || completeDoctorInfo.clinicAddress || "Address",
        phone: appointmentDetails?.phone || completeDoctorInfo.clinicPhone || "Contact",
        email: appointmentDetails?.clinicEmail || "clinic@example.com"
      };
      
      // Generate email template with complete information
      const emailTemplate = PrescriptionEmailTemplate({
        prescription: prescriptionForEmail,
        patientInfo: patientInfo,
        doctorInfo: completeDoctorInfo,
        clinicInfo: completeClinicInfo
      });
      
      const emailHTML = emailTemplate.getHTML();
      
      console.log('📧 Sending email with template:', {
        to: patientEmail,
        subject: `Prescription from Dr. ${completeDoctorInfo.doctorName || 'Physician'}`,
        medications: validMeds.length,
        patientName: `${patientInfo?.patientFirstName} ${patientInfo?.patientLastName}`,
        doctorName: completeDoctorInfo.doctorName,
        doctorId: completeDoctorInfo.doctorId,
        clinicName: completeClinicInfo.clinicName
      });
      
      // Copy email HTML to clipboard
      navigator.clipboard.writeText(emailHTML).then(() => {
        alert(`✅ Email template generated and copied!\\n\\nRecipient: ${patientEmail}\\n\\nYou can now paste this into your email client to send to the patient.`);
        console.log('✅ Email HTML copied to clipboard');
      }).catch(err => {
        console.error('Failed to copy to clipboard:', err);
        alert(`✅ Email template generated!\\n\\nRecipient: ${patientEmail}\\n\\nPlease check the browser console for the email content.`);
      });
      
    } catch (error) {
      console.error('Error sending email:', error);
      alert(`❌ Error preparing email: ${error.message}`);
    } finally {
      setSendingEmail(false);
    }
  };

  // Add Medication Modal
  const AddMedicationModal = () => {
    return (
      <AnimatePresence>
        {showAddMedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]"
            onClick={() => setShowAddMedModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 sticky top-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    💊 Add New Medication to Inventory
                  </h3>
                  <button
                    onClick={() => setShowAddMedModal(false)}
                    className="text-white/80 hover:text-white transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Medication Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMedicationForm.itemName}
                      onChange={(e) => setNewMedicationForm({ ...newMedicationForm, itemName: e.target.value })}
                      placeholder="e.g., Amoxicillin 500mg"
                      className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">
                      Medication Code / SKU <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={newMedicationForm.itemCode}
                      onChange={(e) => setNewMedicationForm({ ...newMedicationForm, itemCode: e.target.value })}
                      placeholder="e.g., AMOX-500-TAB"
                      className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Category <span className="text-red-500">*</span></label>
                    <select
                      value={newMedicationForm.category}
                      onChange={(e) => {
                        const selected = e.target.value;
                        const subs = categoryOptions[selected] || [];
                        setNewMedicationForm({
                          ...newMedicationForm,
                          category: selected,
                          subCategory: subs[0] || ""
                        });
                      }}
                      className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    >
                      {Object.keys(categoryOptions).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Subcategory</label>
                    <select
                      value={newMedicationForm.subCategory}
                      onChange={(e) => setNewMedicationForm({ ...newMedicationForm, subCategory: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    >
                      {(categoryOptions[newMedicationForm.category] || []).map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                      {(!categoryOptions[newMedicationForm.category] || categoryOptions[newMedicationForm.category].length === 0) && (
                        <option value="">Select subcategory</option>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-stone-700 mb-2">Unit <span className="text-red-500">*</span></label>
                    <select
                      value={newMedicationForm.unit}
                      onChange={(e) => setNewMedicationForm({ ...newMedicationForm, unit: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    >
                      <option value="tablet">tablet</option>
                      <option value="capsule">capsule</option>
                      <option value="mg">mg</option>
                      <option value="ml">ml</option>
                      <option value="gm">gm</option>
                      <option value="unit">unit</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isActiveMed"
                      checked={newMedicationForm.isActive}
                      onChange={(e) => setNewMedicationForm({ ...newMedicationForm, isActive: e.target.checked })}
                      className="w-5 h-5 text-indigo-600 rounded border-indigo-300 focus:ring-indigo-500"
                    />
                    <label htmlFor="isActiveMed" className="text-sm font-semibold text-stone-700">Active medication</label>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-stone-50 px-6 py-4 flex justify-end gap-3 border-t border-stone-200 sticky bottom-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddMedModal(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-800 font-semibold transition"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveNewMedication}
                  disabled={!newMedicationForm.itemName}
                  className={`px-6 py-2 rounded-lg font-semibold text-white transition ${
                    !newMedicationForm.itemName
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                  }`}
                >
                  ✅ Save Medication
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-red-600 px-8 py-6 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-lg">
                  💊
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white">Write Prescription</h2>
                  <p className="text-red-100 text-sm mt-1">
                    {patientInfo?.firstName} {patientInfo?.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
              >
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">
            {/* Patient Medical Info Section */}
            {(medicalHistory?.chronicDiseases || medicalHistory?.patientAllergies) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border-2 border-amber-300 shadow-md"
              >
                <h3 className="text-lg font-bold text-amber-900 mb-4 flex items-center gap-2">
                  <span>⚠️</span> Patient Medical Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {medicalHistory?.chronicDiseases && (
                    <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                      <p className="text-sm font-semibold text-amber-900">Chronic Diseases:</p>
                      <p className="text-sm text-stone-700 mt-1">{medicalHistory.chronicDiseases}</p>
                    </div>
                  )}
                  {medicalHistory?.patientAllergies && (
                    <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                      <p className="text-sm font-semibold text-amber-900">Allergies:</p>
                      <p className="text-sm text-stone-700 mt-1">{medicalHistory.patientAllergies}</p>
                    </div>
                  )}
                  {medicalHistory?.patientCurrentMedications && (
                    <div className="bg-white/50 rounded-lg p-3 border border-amber-200 md:col-span-2">
                      <p className="text-sm font-semibold text-amber-900">Current Medications:</p>
                      <p className="text-sm text-stone-700 mt-1">{medicalHistory.patientCurrentMedications}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Doctor Info Section */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-300">
              <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                <span>👨‍⚕️</span> Doctor Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white/50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">Doctor Name:</p>
                  <p className="text-sm text-stone-700 mt-1">{doctorInfo?.doctorName || "Dr. Unknown"}</p>
                </div>
                <div className="bg-white/50 rounded-lg p-3 border border-blue-200">
                  <p className="text-sm font-semibold text-blue-900">Registration Number:</p>
                  <p className="text-sm text-stone-700 mt-1">{doctorInfo?.registrationNumber || "N/A"}</p>
                </div>
              </div>
            </div>

            {/* Medications Section */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-300">
              <h3 className="text-lg font-bold text-green-900 mb-6 flex items-center gap-2">
                <span>💊</span> Medications
              </h3>

              <div className="space-y-4">
                {medications.map((med, index) => {
                  const selectedMeta = inventoryMeds.find(medItem => medItem.itemName === med.name);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl p-4 border-2 border-green-200 space-y-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-semibold text-stone-700">
                          Medication {index + 1}
                        </label>
                        {medications.length > 1 && (
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleRemoveMedicationRow(index)}
                            className="text-red-500 hover:text-red-700 font-semibold transition"
                          >
                            ✕
                          </motion.button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-stone-700 mb-1">
                            Medication Name <span className="text-red-500">*</span>
                          </label>
                          <div className="flex flex-col gap-3 md:flex-row md:items-end">
                            <div className="flex-1">
                              <InventoryAutoComplete
                                value={{ itemName: med.name, itemId: 0 }}
                                onChange={(item) => {
                                  const updated = [...medications];
                                  updated[index].name = item.itemName;
                                  setMedications(updated);
                                }}
                                onSelect={(item) => {
                                  const updated = [...medications];
                                  updated[index].name = item.itemName;
                                  setMedications(updated);
                                }}
                                masterItems={inventoryMeds}
                                placeholder="Search medication by name or code..."
                                onAddNewItem={(item) => {
                                  // Pre-fill the new medication form with the search term
                                  setNewMedicationForm({
                                    ...newMedicationForm,
                                    itemName: item.itemName || ""
                                  });
                                  setMedicationToAdd(index);
                                  setShowAddMedModal(true);
                                }}
                              />
                            </div>
                          </div>

                          {med.name && (
                            <div className="mt-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-xs text-stone-600">
                              ✓ Selected: <span className="font-semibold text-stone-900">{med.name}</span>
                              {inventoryMeds.find(m => m.itemName === med.name)?.itemCode && (
                                <span className="ml-2">Code: {inventoryMeds.find(m => m.itemName === med.name)?.itemCode}</span>
                              )}
                            </div>
                          )}
                        </div>

                        {selectedMeta && (
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-stone-600 md:col-span-2">
                            <div className="flex flex-wrap gap-3">
                              <span className="font-semibold text-stone-700">Code:</span>
                              <span>{selectedMeta.itemCode || 'N/A'}</span>
                              <span className="font-semibold text-stone-700">Category:</span>
                              <span>{selectedMeta.category || 'N/A'}</span>
                              <span className="font-semibold text-stone-700">Unit:</span>
                              <span>{selectedMeta.unit || 'N/A'}</span>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-1">
                            Dosage <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => handleMedicationChange(index, "dosage", e.target.value)}
                            placeholder="e.g., 500mg"
                            className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-1">
                            Frequency <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={med.frequency}
                            onChange={(e) => handleMedicationChange(index, "frequency", e.target.value)}
                            className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                          >
                            <option value="">Select frequency</option>
                            <option value="Once daily">Once daily</option>
                            <option value="Twice daily">Twice daily</option>
                            <option value="Three times daily">Three times daily</option>
                            <option value="Four times daily">Four times daily</option>
                            <option value="As needed">As needed</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-stone-700 mb-1">
                            Duration <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={med.duration}
                            onChange={(e) => handleMedicationChange(index, "duration", e.target.value)}
                            placeholder="e.g., 5 days"
                            className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-stone-700 mb-1">
                            Special Instructions
                          </label>
                          <input
                            type="text"
                            value={med.instructions}
                            onChange={(e) => handleMedicationChange(index, "instructions", e.target.value)}
                            placeholder="e.g., Take with food, Avoid dairy"
                            className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddMedicationRow}
                  className="w-full px-4 py-3 border-2 border-dashed border-green-400 rounded-xl text-green-700 font-semibold hover:bg-green-50 transition"
                >
                  ➕ Add Another Medication
                </motion.button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-stone-50 px-8 py-5 flex justify-between items-center border-t border-stone-200 sticky bottom-0 gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="px-6 py-2.5 text-stone-600 hover:text-stone-800 font-semibold transition"
            >
              Cancel
            </motion.button>
            
            <div className="flex gap-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className={`px-6 py-2.5 rounded-lg font-semibold text-white transition shadow-lg flex items-center gap-2 ${
                  sendingEmail
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                }`}
              >
                <span>📧</span>
                {sendingEmail ? "Sending..." : "Send Email"}
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSavePrescription}
                disabled={savingPrescription}
                className={`px-6 py-2.5 rounded-lg font-semibold text-white transition shadow-lg ${
                  savingPrescription
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700"
                }`}
              >
                {savingPrescription ? "Saving..." : "💊 Save Prescription"}
              </motion.button>
            </div>
          </div>

          {/* Add Medication Modal */}
          <AddMedicationModal />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrescriptionWritingModal;
