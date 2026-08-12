import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPatientVisit, getMedicalInfoSummary } from '../api/hmsApi';
import { searchDoctors } from '../services/doctorService';
import { getClinicByClinicId } from '../services/clinicService';
import { sendEmail } from '../services/emailService';
import { getDoctorIdFromToken } from '../services/tokenManager';
import PrescriptionPrint from './PrescriptionPrint';
import PrescriptionEmailTemplate from './PrescriptionEmailTemplate';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

// Print Preview Modal Component
const PrintPreviewModal = ({ isOpen, onClose, prescription, patientInfo, doctorInfo, clinicInfo }) => {
  const printRef = useRef(null);

  const handlePrint = () => {
    if (printRef.current) {
      setTimeout(() => {
        window.print();
      }, 100);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
          onClick={onClose}
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
                  onClick={handlePrint}
                  className="px-4 py-2 bg-white text-blue-600 rounded-lg font-bold hover:bg-blue-50 transition text-sm"
                >
                  🖨️ Print Now
                </motion.button>
                <button
                  onClick={onClose}
                  className="text-2xl hover:bg-white/20 p-2 rounded-full transition"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="p-8 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 80px)' }}>
              <div ref={printRef} className="bg-white">
                <PrescriptionPrint
                  prescription={prescription}
                  patientInfo={patientInfo}
                  doctorInfo={doctorInfo}
                  clinicInfo={clinicInfo}
                  ref={printRef}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Email Modal Component
const EmailModal = ({ isOpen, onClose, prescription, patientInfo, doctorInfo, clinicInfo, onSend }) => {
  const [isSending, setIsSending] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState(patientInfo?.email || patientInfo?.patientEmail || '');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      alert('Please enter a recipient email address');
      return;
    }

    setIsSending(true);
    try {
      // Use doctorInfo directly from props — already fetched via SearchDoctors by parent
      const emailTemplate = PrescriptionEmailTemplate({ prescription, patientInfo, doctorInfo, clinicInfo });
      const emailHTML = emailTemplate.getHTML();

      await sendEmail({
        Email: recipientEmail,
        Subject: `Prescription from Dr. ${doctorInfo?.doctorName || 'Your Doctor'} - ${clinicInfo?.clinicName || 'Clinic'}`,
        HtmlBody: emailHTML
      });

      // Treat no-exception as success — backend may return plain text, not { success: true }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
        if (onSend) onSend();
      }, 2500);
    } catch (error) {
      console.error('Error sending email:', error);
      alert('❌ Error sending email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-2 border-green-200"
            >
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 flex items-center justify-between text-white">
                <h2 className="text-2xl font-bold">📧 Send Prescription</h2>
                <button onClick={onClose} className="text-2xl hover:bg-white/20 p-2 rounded-full transition">✕</button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-2">Recipient Email</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full p-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-sm text-green-800">
                  <strong>Email will include:</strong> clinic details, doctor info, diagnosis, medications list.
                </div>

                <div className="flex gap-3 pt-2">
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-slate-200 text-slate-800 rounded-lg font-bold hover:bg-slate-300 transition text-sm"
                  >
                    Cancel
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={handleSendEmail}
                    disabled={isSending}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 text-sm"
                  >
                    {isSending ? '📤 Sending...' : '📤 Send Email'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Centered Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[80] p-4"
          >
            <motion.div
              initial={{ scale: 0.7, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, y: 30 }}
              transition={{ type: 'spring', damping: 12 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full text-center p-8"
            >
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }} className="text-6xl mb-4">✅</motion.div>
              <p className="text-xl font-black text-green-700">Prescription Sent!</p>
              <p className="text-sm text-slate-500 mt-2">
                Email delivered to<br /><strong>{recipientEmail}</strong>
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Memoized content component to prevent unnecessary re-renders
const DiagnosisContent = React.memo(({ loading, formData, onInputChange, onSave, isSaving, onClose, appointmentData, initialData, patientInfo, doctorInfo, clinicInfo, onPrint, onEmail, onWhatsApp }) => {
  const [medicationList, setMedicationList] = useState([]);
  const [currentMedication, setCurrentMedication] = useState({
    medicineName: '',
    medicationType: 'Tablet',
    dosage: '',
    frequency: '',
    duration: '',
    mealTiming: 'Before Food'
  });

  // Update medication list when prescriptionContent changes
  React.useEffect(() => {
    if (formData.prescriptionContent) {
      try {
        const parsed = JSON.parse(formData.prescriptionContent);
        setMedicationList(Array.isArray(parsed) ? parsed : [parsed]);
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }, [formData.prescriptionContent]);

  const addMedication = () => {
    if (!currentMedication.medicineName.trim()) {
      alert('Please enter a medication name');
      return;
    }
    const updated = [...medicationList, currentMedication];
    setMedicationList(updated);
    onInputChange('prescriptionContent', JSON.stringify(updated));
    setCurrentMedication({
      medicineName: '',
      medicationType: 'Tablet',
      dosage: '',
      frequency: '',
      duration: '',
      mealTiming: 'Before Food'
    });
  };

  const removeMedication = (index) => {
    const updated = medicationList.filter((_, i) => i !== index);
    setMedicationList(updated);
    onInputChange('prescriptionContent', JSON.stringify(updated));
  };

  return (
    <div className="p-8 space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading diagnosis...</p>
        </div>
      ) : (
        <>
          {/* Visit Timeline */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              🗓️ Visit Timeline
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-indigo-50 border-2 border-indigo-100 rounded-xl p-3">
                <p className="text-xs text-slate-500 font-semibold">Visit Date</p>
                <p className="text-sm font-bold text-slate-800">
                  {initialData?.appointmentDate ? new Date(initialData.appointmentDate).toLocaleDateString() : (patientInfo?.visitDate ? new Date(patientInfo.visitDate).toLocaleDateString() : 'N/A')}
                </p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-100 rounded-xl p-3">
                <p className="text-xs text-slate-500 font-semibold">Time</p>
                <p className="text-sm font-bold text-slate-800">
                  {initialData?.startTime || 'N/A'}{initialData?.endTime ? ` - ${initialData.endTime}` : ''}
                </p>
              </div>
              <div className="bg-pink-50 border-2 border-pink-100 rounded-xl p-3">
                <p className="text-xs text-slate-500 font-semibold">Status</p>
                <p className="text-sm font-bold text-slate-800">{initialData?.status || 'Scheduled'}</p>
              </div>
              <div className="bg-cyan-50 border-2 border-cyan-100 rounded-xl p-3">
                <p className="text-xs text-slate-500 font-semibold">Duration</p>
                <p className="text-sm font-bold text-slate-800">{initialData?.durationMinutes ? `${initialData.durationMinutes} min` : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              💬 Chief Complaint
            </label>
            <div className="w-full p-4 border-2 border-amber-200 bg-amber-50 rounded-xl text-sm text-slate-800">
              {initialData?.reasonForVisit || patientInfo?.reasonForVisit || 'Not specified'}
            </div>
          </div>

          {/* Diagnostics */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              🔬 Diagnostics
            </label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => onInputChange('diagnosis', e.target.value)}
              placeholder="Enter diagnosis details..."
              className="w-full p-4 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows="3"
            />
          </div>

          {/* Treatment Provided - ABOVE PRESCRIPTIONS */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              💊 Treatment Provided
            </label>
            <textarea
              value={formData.treatment}
              onChange={(e) => onInputChange('treatment', e.target.value)}
              placeholder="Enter treatment provided..."
              className="w-full p-4 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows="3"
            />
          </div>

          {/* Write Prescription Form - SINGLE ROW FORMAT */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-3">
              📝 Write Prescription (Mandatory)
            </label>

            {/* Medication Input Form - Single Row */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-4">
              <div className="flex flex-nowrap items-end gap-3 overflow-x-auto pb-1">
                <div className="flex-[1.4] shrink-0 min-w-[140px]">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medicine Name *
                  </label>
                  <input
                    type="text"
                    value={currentMedication.medicineName}
                    onChange={(e) => setCurrentMedication({ ...currentMedication, medicineName: e.target.value })}
                    placeholder="e.g., Amoxicillin"
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 shrink-0 min-w-[110px]">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Type
                  </label>
                  <select
                    value={currentMedication.medicationType}
                    onChange={(e) => setCurrentMedication({ ...currentMedication, medicationType: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
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
                <div className="flex-1 shrink-0 min-w-[100px]">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Dosage
                  </label>
                  <input
                    type="text"
                    value={currentMedication.dosage}
                    onChange={(e) => setCurrentMedication({ ...currentMedication, dosage: e.target.value })}
                    placeholder="e.g., 500mg"
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 shrink-0 min-w-[110px]">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Frequency
                  </label>
                  <input
                    type="text"
                    value={currentMedication.frequency}
                    onChange={(e) => setCurrentMedication({ ...currentMedication, frequency: e.target.value })}
                    placeholder="e.g., 3x daily"
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1 shrink-0 min-w-[100px]">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration
                  </label>
                  <input
                    type="text"
                    value={currentMedication.duration}
                    onChange={(e) => setCurrentMedication({ ...currentMedication, duration: e.target.value })}
                    placeholder="e.g., 7 days"
                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-[1.3] shrink-0 min-w-[190px]">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Meal Timing
                  </label>
                  <div className="flex items-center gap-4 h-[38px] px-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={currentMedication.mealTiming === 'Before Food'}
                        onChange={() => setCurrentMedication({ ...currentMedication, mealTiming: 'Before Food' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-slate-700 whitespace-nowrap">Before Food</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={currentMedication.mealTiming === 'After Food'}
                        onChange={() => setCurrentMedication({ ...currentMedication, mealTiming: 'After Food' })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm text-slate-700 whitespace-nowrap">After Food</span>
                    </label>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={addMedication}
                  className="px-4 py-2 h-[38px] shrink-0 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition whitespace-nowrap"
                >
                  ➕ Add
                </motion.button>
              </div>
            </div>

            {/* Medications List */}
            {medicationList.length > 0 && (
              <div className="space-y-2 mb-4">
                <label className="block text-xs font-semibold text-slate-700">
                  Added Medications ({medicationList.length}):
                </label>
                {medicationList.map((med, idx) => (
                  <div key={idx} className="bg-slate-50 border-l-4 border-blue-500 p-3 rounded-lg flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{med.medicineName}</p>
                      <p className="text-xs text-slate-600">
                        {med.medicationType} | {med.dosage || 'No dosage'} | {med.frequency} | {med.duration} | {med.mealTiming}
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeMedication(idx)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
                    >
                      ✕ Remove
                    </motion.button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              📝 Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => onInputChange('notes', e.target.value)}
              placeholder="Enter any additional notes..."
              className="w-full p-4 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
              rows="2"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t-2 border-purple-200">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-200 text-slate-800 rounded-lg font-bold hover:bg-slate-300 transition text-sm"
            >
              ✕ Close
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (medicationList.length === 0) {
                  alert('Please add at least one medication before saving.');
                  return;
                }
                onSave();
              }}
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition disabled:opacity-50 text-sm"
            >
              {isSaving ? '💾 Saving...' : '💾 Save Diagnosis'}
            </motion.button>
          </div>
        </>
      )}
    </div>
  );
});

DiagnosisContent.displayName = 'DiagnosisContent';


export default function DiagnosisModal({ isOpen, onClose, appointmentId, initialData, onSave }) {
  const [diagnosisData, setDiagnosisData] = useState(initialData || null);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [appointmentData, setAppointmentData] = useState(null);
  const [patientInfo, setPatientInfo] = useState(null);
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [clinicInfo, setClinicInfo] = useState(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  const [formData, setFormData] = useState({
    diagnosis: '',
    treatment: '',
    notes: '',
    medications: '',
    prescriptionContent: ''
  });

  // Fetch diagnosis, visit info, and appointment details when modal opens
  useEffect(() => {
    if (appointmentId && isOpen) {
      const fetchDiagnosisAndRelatedData = async () => {
        setLoading(true);
        try {
          let patientIdVal = null;
          let medicalInfoData = null;
          let existingDiagnosis = null;

          // Call 1: Get Patient Visit details (includes patient ID)
          try {
            const visitData = await getPatientVisit(appointmentId);
            console.log('📋 Visit Data:', visitData);
            patientIdVal = visitData?.patientId || visitData?.PatientId;
            setPatientInfo(visitData);
          } catch (err) {
            console.warn('⚠️ Could not fetch visit data:', err);
          }

          // Call 2: Load doctor (SearchDoctors) and clinic (GetClinicByClinicId)
          // Prefer the appointment's doctorId from initialData so we get the right doctor's license number
          try {
            const selectedAccess = JSON.parse(localStorage.getItem('selectedAccess') || '{}');
            const userData = JSON.parse(localStorage.getItem('userData') || '{}');

            // Appointment already knows the physician — use that doctorId first
            const apptDoctorId = Number(initialData?.doctorId) || 0;
            const apptDoctorName = initialData?.doctorName || initialData?.attendingPhysician || '';
            const doctorId   = apptDoctorId || getDoctorIdFromToken() || selectedAccess.doctorId || userData.doctorId || 0;
            const enterpriseId = selectedAccess.enterpriseId || userData.enterpriseId || 0;
            const clinicId   = selectedAccess.clinicId   || userData.clinicId   || 0;

            // Doctor: SearchDoctors?EnterpriseID=&DoctorID=
            if (doctorId && enterpriseId) {
              try {
                const results = await searchDoctors({ doctorId, enterpriseId });
                const doc = Array.isArray(results) ? results[0] : results;
                if (doc) {
                  const apiName = `${doc.firstName || ''} ${doc.lastName || ''}`.trim();
                  setDoctorInfo({
                    doctorId: doc.doctorId,
                    doctorName: apiName || apptDoctorName,
                    firstName: doc.firstName || '',
                    lastName: doc.lastName || '',
                    speciality: doc.speciality || doc.specialtyName || '',
                    registrationNumber: doc.licenseNumber || doc.LicenseNumber || ''
                  });
                } else if (apptDoctorName) {
                  // API returned nothing — fall back to appointment's physician name
                  setDoctorInfo({ doctorId: apptDoctorId, doctorName: apptDoctorName, registrationNumber: '' });
                }
              } catch (docErr) {
                console.warn('⚠️ SearchDoctors failed:', docErr);
                if (apptDoctorName) {
                  setDoctorInfo({ doctorId: apptDoctorId, doctorName: apptDoctorName, registrationNumber: '' });
                }
              }
            } else if (apptDoctorName) {
              setDoctorInfo({ doctorId: apptDoctorId, doctorName: apptDoctorName, registrationNumber: '' });
            }

            // Clinic: GetClinicByClinicId?id=
            if (clinicId) {
              try {
                const clinicResults = await getClinicByClinicId([clinicId]);
                const clinic = Array.isArray(clinicResults) ? clinicResults[0] : clinicResults;
                if (clinic) setClinicInfo(clinic);
              } catch (clinicErr) {
                console.warn('⚠️ GetClinicByClinicId failed:', clinicErr);
              }
            }
          } catch (err) {
            console.warn('⚠️ Could not load doctor/clinic data:', err);
          }

          // Call 3: Get existing diagnosis (if any) - this takes priority
          try {
            const response = await fetch(
              `${API_BASE_URL}/Diagnosis/GetDiagnosisByAppointmentId?appointmentId=${appointmentId}`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (response.ok) {
              existingDiagnosis = await response.json();
              console.log('✅ Existing Diagnosis Found:', existingDiagnosis);
              setDiagnosisData(existingDiagnosis);
            }
          } catch (err) {
            console.warn('⚠️ Could not fetch existing diagnosis:', err);
          }

          // Call 4: If we have a patientId and NO existing diagnosis, fetch medical info summary
          if (patientIdVal && !existingDiagnosis) {
            try {
              medicalInfoData = await getMedicalInfoSummary(patientIdVal);
              console.log('🏥 Medical Info Summary:', medicalInfoData);
            } catch (err) {
              console.warn('⚠️ Could not fetch medical info summary:', err);
            }
          }

          // Auto-fill form: Priority is Existing Diagnosis > Medical Info > Empty
          if (existingDiagnosis) {
            // Use existing diagnosis
            setFormData({
              diagnosis: existingDiagnosis.diagnosis || '',
              treatment: existingDiagnosis.treatment || '',
              notes: existingDiagnosis.notes || '',
              medications: existingDiagnosis.medications || '',
              prescriptionContent: existingDiagnosis.prescriptionContent || ''
            });
          } else if (medicalInfoData) {
            // Use medical info summary as fallback
            setFormData({
              diagnosis: medicalInfoData.diagnosis || '',
              treatment: medicalInfoData.treatment || '',
              medications: medicalInfoData.medications || '',
              notes: medicalInfoData.notes || '',
              prescriptionContent: medicalInfoData.prescriptionContent || ''
            });
          } else {
            // Keep empty form for manual entry
            setFormData({
              diagnosis: '',
              treatment: '',
              notes: '',
              medications: '',
              prescriptionContent: ''
            });
          }
        } finally {
          setLoading(false);
        }
      };

      fetchDiagnosisAndRelatedData();
    } else if (!isOpen) {
      // Reset form when modal closes
      setFormData({
        diagnosis: '',
        treatment: '',
        notes: '',
        medications: '',
        prescriptionContent: ''
      });
    }
  }, [appointmentId, isOpen]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const method = diagnosisData?.diagnosisId ? 'PUT' : 'POST';
      const endpoint = diagnosisData?.diagnosisId 
        ? `${API_BASE_URL}/Diagnosis/${diagnosisData.diagnosisId}`
        : `${API_BASE_URL}/Diagnosis`;

      // Get appointment date from appointmentData or patientInfo
      const appointmentDate = appointmentData?.appointmentDate || patientInfo?.visitDate || new Date().toISOString();

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          appointmentId,
          visitDate: appointmentDate
        })
      });

      if (response.ok) {
        const saved = await response.json();
        setDiagnosisData(saved);
        if (onSave) onSave();
      }
    } catch (err) {
      console.error('Error saving diagnosis:', err);
    } finally {
      setIsSaving(false);
    }
  }, [diagnosisData?.diagnosisId, formData, appointmentId, appointmentData, patientInfo, onSave]);

  const handleWhatsApp = () => {
    const patientPhone = patientInfo?.phone || patientInfo?.patientPhone || '';
    if (!patientPhone) {
      alert('Patient phone number not available');
      return;
    }

    const prescriptionText = `🏥 *Prescription from Dr. ${doctorInfo?.doctorName || 'Doctor'}*\n\n` +
      `📋 *Medications:*\n${formData.medications}\n\n` +
      `📝 *Instructions:* Follow the dosage as prescribed.\n\n` +
      `🏥 *Clinic:* ${clinicInfo?.clinicName || 'Clinic'}\n` +
      `📞 ${clinicInfo?.phone || 'Phone'}\n\n` +
      `*For any queries, contact us.* ☺️`;

    const encodedText = encodeURIComponent(prescriptionText);
    const whatsappURL = `https://api.whatsapp.com/send?phone=${patientPhone}&text=${encodedText}`;
    window.open(whatsappURL, '_blank');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-pink-200"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 sticky top-0 flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl font-bold">🏥 Diagnosis & Treatment</h2>
                  <p className="text-purple-100">Appointment ID: {appointmentId}</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-2xl hover:bg-white/20 p-2 rounded-full transition"
                >
                  ✕
                </button>
              </div>

              {/* Content - Memoized to prevent unnecessary re-renders */}
              <DiagnosisContent
                loading={loading}
                formData={formData}
                onInputChange={handleInputChange}
                onSave={handleSave}
                isSaving={isSaving}
                onClose={onClose}
                appointmentData={appointmentData}
                initialData={initialData}
                patientInfo={patientInfo}
                doctorInfo={doctorInfo}
                clinicInfo={clinicInfo}
                onPrint={() => setShowPrintPreview(true)}
                onEmail={() => setShowEmailModal(true)}
                onWhatsApp={handleWhatsApp}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        prescription={{
          prescriptionId: diagnosisData?.diagnosisId,
          prescriptionDate: new Date().toISOString(),
          prescriptionContent: formData.prescriptionContent || formData.medications,
          ...diagnosisData
        }}
        patientInfo={patientInfo || appointmentData?.patient}
        doctorInfo={doctorInfo || {
          doctorName: appointmentData?.doctor?.name || 'Doctor Name',
          registrationNumber: appointmentData?.doctor?.registrationNumber || 'N/A'
        }}
        clinicInfo={clinicInfo}
      />

      {/* Email Modal */}
      <EmailModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        prescription={{
          prescriptionId: diagnosisData?.diagnosisId,
          prescriptionDate: new Date().toISOString(),
          prescriptionContent: formData.prescriptionContent || formData.medications,
          ...diagnosisData
        }}
        patientInfo={patientInfo || appointmentData?.patient}
        doctorInfo={doctorInfo || {
          doctorName: appointmentData?.doctor?.name || 'Doctor Name',
          registrationNumber: appointmentData?.doctor?.registrationNumber || 'N/A'
        }}
        clinicInfo={clinicInfo}
        onSend={onSave}
      />
    </>
  );
}
