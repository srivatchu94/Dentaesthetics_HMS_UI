import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPatientVisit, getMedicalInfoSummary } from '../api/hmsApi';
import { sendEmail } from '../services/emailService';
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

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      alert('Please enter a recipient email address');
      return;
    }

    setIsSending(true);
    try {
      const emailTemplate = PrescriptionEmailTemplate({ prescription, patientInfo, doctorInfo, clinicInfo });
      const emailHTML = emailTemplate.getHTML();

      const response = await sendEmail({
        Email: recipientEmail,
        Subject: `Prescription from Dr. ${doctorInfo?.doctorName || 'Your Doctor'} - ${clinicInfo?.clinicName || 'Clinic'}`,
        HtmlBody: emailHTML
      });

      if (response.success) {
        alert('✅ Prescription email sent successfully!');
        onClose();
        if (onSend) onSend();
      } else {
        alert('❌ Failed to send email. Please try again.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('❌ Error sending email. Please try again.');
    } finally {
      setIsSending(false);
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
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full border-2 border-green-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 flex items-center justify-between text-white">
              <h2 className="text-2xl font-bold">📧 Send Email</h2>
              <button
                onClick={onClose}
                className="text-2xl hover:bg-white/20 p-2 rounded-full transition"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="patient@example.com"
                  className="w-full p-3 border-2 border-green-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>📧 Email will include:</strong>
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
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-200 text-slate-800 rounded-lg font-bold hover:bg-slate-300 transition text-sm"
                >
                  ✕ Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
  );
};

// Memoized content component to prevent unnecessary re-renders
const DiagnosisContent = React.memo(({ loading, formData, onInputChange, onSave, isSaving, onClose, appointmentData, patientInfo, doctorInfo, clinicInfo, onPrint, onEmail, onWhatsApp }) => {
  return (
    <div className="p-8 space-y-6">
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading diagnosis...</p>
        </div>
      ) : (
        <>
          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              🔍 Diagnosis
            </label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => onInputChange('diagnosis', e.target.value)}
              placeholder="Enter diagnosis details..."
              className="w-full p-4 border-2 border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              rows="3"
            />
          </div>

          {/* Treatment */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              💊 Treatment Plan
            </label>
            <textarea
              value={formData.treatment}
              onChange={(e) => onInputChange('treatment', e.target.value)}
              placeholder="Enter treatment plan..."
              className="w-full p-4 border-2 border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              rows="3"
            />
          </div>

          {/* Medications Input */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              💉 Medications
            </label>
            <textarea
              value={formData.medications}
              onChange={(e) => onInputChange('medications', e.target.value)}
              placeholder="Enter prescribed medications..."
              className="w-full p-4 border-2 border-pink-200 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              rows="2"
            />
          </div>

          {/* Prescription Content */}
          <div>
            <label className="block text-sm font-bold text-slate-800 mb-2">
              📋 Prescription Details (JSON Format - Optional)
            </label>
            <textarea
              value={formData.prescriptionContent}
              onChange={(e) => onInputChange('prescriptionContent', e.target.value)}
              placeholder='[{"medicineName":"Amoxicillin","dosage":"500mg","frequency":"3 times daily","duration":"7 days","specialInstructions":"Take with water"}]'
              className="w-full p-4 border-2 border-cyan-200 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-transparent resize-none font-mono text-xs"
              rows="2"
            />
            <p className="text-xs text-slate-600 mt-2">💡 Tip: Use JSON format for better formatting in print/email</p>
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
              onClick={onSave}
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

          // Call 2: Get appointment details (doctor, clinic, patient info)
          try {
            const appointmentResponse = await fetch(
              `${API_BASE_URL}/Appointment/${appointmentId}`,
              {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
                  'Content-Type': 'application/json'
                }
              }
            );

            if (appointmentResponse.ok) {
              const appointmentDetails = await appointmentResponse.json();
              console.log('📅 Appointment Details:', appointmentDetails);
              setAppointmentData(appointmentDetails);
              
              // Extract doctor info from appointment
              if (appointmentDetails.doctor) {
                setDoctorInfo(appointmentDetails.doctor);
              }
              
              // Extract clinic info from appointment or user data
              if (appointmentDetails.clinic) {
                setClinicInfo(appointmentDetails.clinic);
              } else {
                const userData = localStorage.getItem('userData');
                if (userData) {
                  try {
                    const parsed = JSON.parse(userData);
                    setClinicInfo({
                      clinicName: parsed.clinicName || 'My Dental Clinic',
                      clinicId: parsed.clinicId,
                      address: parsed.clinicAddress || 'Clinic Address',
                      phone: parsed.clinicPhone || '+1-555-1234',
                      email: parsed.clinicEmail || 'clinic@example.com'
                    });
                  } catch (e) {
                    console.warn('Error parsing user data');
                  }
                }
              }
            }
          } catch (err) {
            console.warn('⚠️ Could not fetch appointment details:', err);
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
