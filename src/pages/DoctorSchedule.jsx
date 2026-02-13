import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FancyDatePicker from '../components/FancyDatePicker';
import DiagnosisModal from '../components/DiagnosisModal';
import { getPatientVisit } from '../services/patientService';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

export default function DoctorSchedule() {
  // State variables
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Appointment detail state
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Prescriptions and diagnosis data
  const [prescriptions, setPrescriptions] = useState([]);
  const [diagnosisData, setDiagnosisData] = useState(null);
  
  // Edit state - kept separate to prevent flicker
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  
  // Diagnosis modal state - kept completely separate (no parent re-render)
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const diagnosisModalRef = useRef(null);
  
  // User data
  const [doctorId, setDoctorId] = useState(null);
  const clinicIdRef = useRef(null);

  // Initialize doctor ID once on mount
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setDoctorId(parsed.doctorId || parsed.id);
        clinicIdRef.current = parsed.clinicId;
      } catch (e) {
        console.log('Error parsing userData');
      }
    }
  }, []);

  // Fetch appointments only when date or doctorId changes
  useEffect(() => {
    if (doctorId && selectedDate) {
      fetchAppointments();
    }
  }, [selectedDate, doctorId]);

  // Fetch appointment list
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const appointmentDate = selectedDate ? new Date(selectedDate).toISOString() : null;
      const response = await fetch(
        `${API_BASE_URL}/Appointment/GetAppointmentById?doctorId=${doctorId}&appointmentDate=${appointmentDate}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAppointments(Array.isArray(data) ? data : data.data || []);
      } else {
        setError('Failed to fetch appointments');
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Error fetching appointments');
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, doctorId]);

  // Fetch details for selected appointment - only when appointmentId changes
  useEffect(() => {
    if (selectedAppointmentId) {
      fetchAppointmentDetails();
    }
  }, [selectedAppointmentId]);

  const fetchAppointmentDetails = useCallback(async () => {
    setDetailLoading(true);
    setPrescriptions([]);
    setDiagnosisData(null);
    try {
      // First, fetch basic appointment details
      const response = await fetch(
        `${API_BASE_URL}/Appointment/GetAppointmentDetailsbyAppointmentID?appointmentId=${selectedAppointmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const detailedData = await response.json();
        setSelectedAppointmentDetails(detailedData);
        // Reset edit state when loading new appointment
        setIsEditing(false);
        setEditFormData(null);
      } else {
        console.error('Failed to fetch appointment details');
      }
      
      // Then, fetch comprehensive visit data including prescriptions and diagnosis
      try {
        console.log('📋 Fetching GetPatientVisit for appointmentId:', selectedAppointmentId);
        const visitData = await getPatientVisit(selectedAppointmentId);
        console.log('✅ Visit data received:', visitData);
        
        // Extract prescriptions
        if (visitData?.prescriptions && Array.isArray(visitData.prescriptions)) {
          setPrescriptions(visitData.prescriptions);
          console.log('✅ Prescriptions loaded:', visitData.prescriptions);
        }
        
        // Extract diagnosis data
        if (visitData?.diagnosis) {
          setDiagnosisData(visitData.diagnosis);
          console.log('✅ Diagnosis data loaded:', visitData.diagnosis);
        }
      } catch (visitErr) {
        console.log('⚠️ Note: GetPatientVisit not available or no visit data yet:', visitErr.message);
        // This is not critical - continue with basic appointment details
      }
    } catch (err) {
      console.error('Error fetching appointment details:', err);
    } finally {
      setDetailLoading(false);
    }
  }, [selectedAppointmentId]);

  // Handle selecting appointment - keep diagnosis modal isolated
  const handleSelectAppointment = useCallback((appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    // Ensure diagnosis modal is closed when selecting new appointment
    setShowDiagnosisModal(false);
  }, []);

  // Handle edit toggle
  const handleEditToggle = useCallback(() => {
    if (!isEditing && selectedAppointmentDetails) {
      // Enter edit mode - copy current data
      setEditFormData({ ...selectedAppointmentDetails });
    } else {
      // Exit edit mode - discard changes
      setEditFormData(null);
    }
    setIsEditing(!isEditing);
  }, [isEditing, selectedAppointmentDetails]);

  // Handle edit form change
  const handleEditChange = useCallback((field, value) => {
    setEditFormData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  // Handle save edit
  const handleSaveEdit = useCallback(async () => {
    if (!editFormData) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/Appointment/${selectedAppointmentDetails.appointmentId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(editFormData)
        }
      );

      if (response.ok) {
        // Update displayed details with new data
        setSelectedAppointmentDetails(editFormData);
        setIsEditing(false);
        setEditFormData(null);
        // Refresh appointments list
        await fetchAppointments();
      } else {
        setError('Failed to update appointment');
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Error updating appointment');
    }
  }, [editFormData, selectedAppointmentDetails, fetchAppointments]);

  // Handle diagnosis button click - ISOLATED, doesn't trigger parent re-renders
  const handleOpenDiagnosis = useCallback(() => {
    // Store current appointment ID in ref to avoid state update
    diagnosisModalRef.current = selectedAppointmentDetails?.appointmentId;
    setShowDiagnosisModal(true);
  }, [selectedAppointmentDetails?.appointmentId]);

  // Get status color
  const getStatusColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case 'scheduled':
        return 'from-indigo-500 to-purple-500';
      case 'completed':
        return 'from-purple-500 to-pink-500';
      case 'cancelled':
        return 'from-pink-500 to-purple-500';
      default:
        return 'from-indigo-500 to-purple-500';
    }
  }, []);

  // Find selected appointment in list
  const selectedAppointmentFromList = useMemo(() => {
    return appointments.find(a => a.appointmentId === selectedAppointmentId);
  }, [appointments, selectedAppointmentId]);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6">
      {/* Left side - Appointments list */}
      <div className="w-full lg:w-2/5">
        {/* Date Picker */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-purple-200"
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Date</label>
              <FancyDatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                label=""
              />
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto"></div>
            </motion.div>
            <p className="mt-4 text-slate-600">Loading appointments...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 mb-6"
          >
            {error}
          </motion.div>
        )}

        {/* Appointments List */}
        {!loading && appointments.length > 0 && (
          <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-lg font-bold text-slate-800 mb-4">
              📋 {appointments.length} appointment{appointments.length !== 1 ? 's' : ''}
            </h2>
            {appointments.map((appointment, idx) => (
              <motion.div
                key={appointment.appointmentId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                onClick={() => handleSelectAppointment(appointment.appointmentId)}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${
                  selectedAppointmentId === appointment.appointmentId
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-purple-400 shadow-lg'
                    : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800">
                      {appointment.firstName} {appointment.lastName}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      📅 {new Date(appointment.appointmentDate).toLocaleDateString()} {appointment.startTime}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getStatusColor(appointment.status)}`}>
                    {appointment.status || 'Scheduled'}
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {!loading && appointments.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12 bg-white rounded-2xl shadow-lg border-2 border-purple-200"
          >
            <div className="text-5xl mb-3">📭</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No appointments</h3>
            <p className="text-slate-600 text-sm">Try selecting a different date</p>
          </motion.div>
        )}
      </div>

      {/* Right side - Appointment details */}
      <div className="w-full lg:w-3/5">
        {selectedAppointmentId && selectedAppointmentDetails && !detailLoading ? (
          <motion.div
            key={selectedAppointmentId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
              <h2 className="text-2xl font-bold">
                {selectedAppointmentDetails.firstName} {selectedAppointmentDetails.lastName}
              </h2>
              <p className="text-purple-100 mt-1">Appointment Details</p>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              {detailLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto"></div>
                  <p className="mt-4 text-slate-600">Loading details...</p>
                </div>
              ) : (
                <>
                  {/* Patient Information */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3">👤 Patient Information</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <p className="text-xs text-slate-600 font-semibold">Phone</p>
                        <p className="font-semibold text-slate-800 text-sm">{selectedAppointmentDetails.phoneNumber || 'N/A'}</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <p className="text-xs text-slate-600 font-semibold">Email</p>
                        <p className="font-semibold text-slate-800 text-sm truncate">{selectedAppointmentDetails.email || 'N/A'}</p>
                      </div>
                      <div className="bg-pink-50 p-4 rounded-lg">
                        <p className="text-xs text-slate-600 font-semibold">Age</p>
                        <p className="font-semibold text-slate-800">{selectedAppointmentDetails.age || 'N/A'}</p>
                      </div>
                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <p className="text-xs text-slate-600 font-semibold">Gender</p>
                        <p className="font-semibold text-slate-800">{selectedAppointmentDetails.gender || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Appointment Details */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-3">📅 Appointment Details</h3>
                    <div className="space-y-3">
                      {isEditing && editFormData ? (
                        <>
                          <div>
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">Reason for Visit</label>
                            <textarea
                              value={editFormData.reasonForVisit || ''}
                              onChange={(e) => handleEditChange('reasonForVisit', e.target.value)}
                              className="w-full p-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                              rows="3"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-semibold text-slate-700 mb-2 block">Status</label>
                            <select
                              value={editFormData.status || 'Scheduled'}
                              onChange={(e) => handleEditChange('status', e.target.value)}
                              className="w-full p-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                            >
                              <option>Scheduled</option>
                              <option>Completed</option>
                              <option>Cancelled</option>
                            </select>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-indigo-50 p-4 rounded-lg">
                            <p className="text-xs text-slate-600 font-semibold">Date & Time</p>
                            <p className="font-semibold text-slate-800">
                              {new Date(selectedAppointmentDetails.appointmentDate).toLocaleDateString()} {selectedAppointmentDetails.startTime}
                              {selectedAppointmentDetails.endTime ? ` - ${selectedAppointmentDetails.endTime}` : ''}
                            </p>
                          </div>
                          <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-xs text-slate-600 font-semibold">Reason for Visit</p>
                            <p className="font-semibold text-slate-800">{selectedAppointmentDetails.reasonForVisit || 'N/A'}</p>
                          </div>
                          <div className="bg-pink-50 p-4 rounded-lg">
                            <p className="text-xs text-slate-600 font-semibold">Status</p>
                            <p className="font-semibold text-slate-800">{selectedAppointmentDetails.status || 'Scheduled'}</p>
                          </div>
                          <div className="bg-indigo-50 p-4 rounded-lg">
                            <p className="text-xs text-slate-600 font-semibold">Duration</p>
                            <p className="font-semibold text-slate-800">{selectedAppointmentDetails.durationMinutes || 'N/A'} minutes</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Prescriptions Section */}
                  {prescriptions && prescriptions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border-2 border-green-200"
                    >
                      <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                        <span>💊</span> Prescriptions ({prescriptions.length})
                      </h3>
                      <div className="space-y-3">
                        {prescriptions.map((prescription, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white rounded-xl p-4 border-l-4 border-green-500 shadow-sm hover:shadow-md transition-shadow"
                          >
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-xs font-bold text-gray-600 uppercase">Medicine</p>
                                <p className="text-gray-900 font-semibold">{prescription.medicineName || prescription.medicineId || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-600 uppercase">Dosage</p>
                                <p className="text-gray-900 font-semibold">{prescription.dosage || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-600 uppercase">Frequency</p>
                                <p className="text-gray-900 font-semibold">{prescription.frequency || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs font-bold text-gray-600 uppercase">Duration</p>
                                <p className="text-gray-900 font-semibold">{prescription.duration || 'N/A'}</p>
                              </div>
                              {prescription.instructions && (
                                <div className="col-span-2">
                                  <p className="text-xs font-bold text-gray-600 uppercase">Instructions</p>
                                  <p className="text-gray-700">{prescription.instructions}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4 border-t-2 border-purple-200">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleEditToggle}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition text-sm"
                    >
                      {isEditing ? '❌ Cancel' : '✏️ Edit'}
                    </motion.button>

                    {isEditing && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleSaveEdit}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:shadow-lg transition text-sm"
                      >
                        💾 Save
                      </motion.button>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleOpenDiagnosis}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition text-sm"
                    >
                      🏥 Diagnosis
                    </motion.button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ) : detailLoading ? (
          <div className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading appointment details...</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl border-2 border-purple-200 p-12 text-center"
          >
            <div className="text-6xl mb-4">👈</div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Select an Appointment</h3>
            <p className="text-slate-600">Click on an appointment from the list to view details</p>
          </motion.div>
        )}
      </div>

      {/* Diagnosis Modal - Using ref to prevent parent re-renders when modal opens */}
      <DiagnosisModal
        isOpen={showDiagnosisModal}
        onClose={() => setShowDiagnosisModal(false)}
        appointmentId={selectedAppointmentId}
        initialData={diagnosisData || selectedAppointmentDetails}
        onSave={(diagnosisData) => {
          console.log("Diagnosis saved:", diagnosisData);
          setDiagnosisData(diagnosisData);
          setShowDiagnosisModal(false);
        }}
      />
    </div>
  );
}
