import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getClinicIdFromToken, getAccessToken } from '../services/tokenManager';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

// ============ Success Popup Component ============
const SuccessPopup = React.memo(({ message, isVisible, onClose }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 z-[9998]"
            onClick={onClose}
          />
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: -100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.3, y: -100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] w-full max-w-md"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 rounded-3xl shadow-2xl p-8 text-center border-4 border-white"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <p className="text-2xl font-bold text-white mb-2">Success!</p>
              <p className="text-white text-lg font-semibold">{message}</p>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mt-4 text-4xl"
              >
                ✨
              </motion.div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

SuccessPopup.displayName = 'SuccessPopup';

// ============ Patient Tiles Component ============
const PatientTile = React.memo(({ patient, onSelect }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => onSelect(patient)}
      className="bg-white rounded-xl p-6 shadow-lg border-2 border-purple-200 cursor-pointer hover:border-purple-500 transition-all"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-slate-800">
            {patient.firstName} {patient.lastName}
          </h3>
          <p className="text-sm text-slate-600">ID: {patient.patientId}</p>
          <p className="text-sm text-slate-600">📞 {patient.phoneNumber || 'N/A'}</p>
          <p className="text-sm text-slate-600">📧 {patient.email || 'N/A'}</p>
          {patient.dateOfBirth && (
            <p className="text-sm text-slate-600">🎂 DOB: {new Date(patient.dateOfBirth).toLocaleDateString()}</p>
          )}
        </div>
        <div className="text-2xl">→</div>
      </div>
    </motion.div>
  );
});

PatientTile.displayName = 'PatientTile';

// ============ Appointment Tabs Component ============
const AppointmentTabsView = React.memo(({ appointments, selectedAppointment, onSelectAppointment, loading }) => {
  return (
    <div className="space-y-4">
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading appointments...</p>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-8 bg-slate-50 rounded-lg">
          <p className="text-slate-600">No appointments found</p>
        </div>
      ) : (
        appointments.map((apt) => (
          <motion.div
            key={apt.appointmentId}
            whileHover={{ x: 10 }}
            onClick={() => onSelectAppointment(apt)}
            className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedAppointment?.appointmentId === apt.appointmentId
                ? 'bg-purple-100 border-purple-500'
                : 'bg-white border-slate-200 hover:border-purple-300'
            }`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">
                  📅 {new Date(apt.appointmentDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-slate-600">
                  ⏰ {apt.startTime} - {apt.endTime}
                </p>
                <p className="text-sm text-slate-600">
                  👨‍⚕️ Dr. {apt.attendingPhysician || 'N/A'}
                </p>
                <p className="text-sm text-slate-600">
                  📝 {apt.reasonForVisit || 'N/A'}
                </p>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  apt.status === 'Completed'
                    ? 'bg-green-100 text-green-700'
                    : apt.status === 'Cancelled'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-blue-100 text-blue-700'
                }`}
              >
                {apt.status}
              </span>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );
});

AppointmentTabsView.displayName = 'AppointmentTabsView';

// ============ Appointment Details Modal Component ============
const AppointmentDetailsModal = React.memo(({
  isOpen,
  onClose,
  appointment,
  loading,
  onSave,
  savingMessage
}) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loadedAppointmentId, setLoadedAppointmentId] = useState(null);

  // Load appointment data only when appointment changes and hasn't been loaded before
  useEffect(() => {
    if (appointment && isOpen && loadedAppointmentId !== appointment.appointmentId) {
      setFormData({ ...appointment });
      setLoadedAppointmentId(appointment.appointmentId);
      setEditMode(false);
      setError('');
    }
  }, [appointment, isOpen, loadedAppointmentId]);

  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData) return;

    setSaving(true);
    setError('');
    try {
      const token = getAccessToken();
      if (!token) {
        setError('Authentication token not found. Please login again.');
        setSaving(false);
        return;
      }
      const response = await fetch(
        `${API_BASE_URL}/Appointment/UpdateAppointment`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        }
      );

      if (response.ok) {
        setEditMode(false);
        if (onSave) {
          onSave(formData);
        }
      } else {
        setError('Failed to update appointment');
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Error updating appointment');
    } finally {
      setSaving(false);
    }
  }, [formData, onSave]);

  if (!isOpen || !appointment) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 sticky top-0 flex justify-between items-center text-white">
            <h2 className="text-2xl font-bold">📋 Appointment Details</h2>
            <button
              onClick={onClose}
              className="text-2xl hover:bg-white/20 p-2 rounded-full transition"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading appointment details...</p>
              </div>
            ) : (
              <>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                    {error}
                  </div>
                )}

                {editMode && formData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Reason for Visit
                        </label>
                        <textarea
                          value={formData.reasonForVisit || ''}
                          onChange={(e) => handleInputChange('reasonForVisit', e.target.value)}
                          className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                          rows="2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Status
                        </label>
                        <select
                          value={formData.status || ''}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="No-show">No-show</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => handleInputChange('notes', e.target.value)}
                        className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        rows="3"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={formData.startTime || ''}
                          onChange={(e) => handleInputChange('startTime', e.target.value)}
                          className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={formData.endTime || ''}
                          onChange={(e) => handleInputChange('endTime', e.target.value)}
                          className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">Appointment Date</p>
                      <p className="text-lg font-bold text-slate-800">
                        {formData?.appointmentDate ? new Date(formData.appointmentDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">Status</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                          formData?.status === 'Completed'
                            ? 'bg-green-100 text-green-700'
                            : formData?.status === 'Cancelled'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {formData?.status || 'N/A'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600 font-semibold">Reason for Visit</p>
                      <p className="text-slate-800">{formData?.reasonForVisit || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">Start Time</p>
                      <p className="text-slate-800">{formData?.startTime || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">End Time</p>
                      <p className="text-slate-800">{formData?.endTime || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-semibold">Doctor</p>
                      <p className="text-slate-800">{formData?.attendingPhysician || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-slate-600 font-semibold">Notes</p>
                      <p className="text-slate-800">{formData?.notes || 'N/A'}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {!loading && (
            <div className="bg-slate-50 p-6 flex gap-3 border-t border-slate-200">
              <button
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition disabled:opacity-50"
              >
                Close
              </button>
              {editMode ? (
                <>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setFormData({ ...appointment });
                    }}
                    disabled={saving}
                    className="flex-1 px-6 py-3 rounded-lg bg-slate-300 text-slate-700 font-semibold hover:bg-slate-400 transition disabled:opacity-50"
                  >
                    Cancel Edit
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition disabled:opacity-50"
                  >
                    {saving ? '💾 Updating...' : '💾 Update Appointment'}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  disabled={saving}
                  className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold hover:shadow-lg transition disabled:opacity-50"
                >
                  ✏️ Edit Appointment
                </button>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
});

AppointmentDetailsModal.displayName = 'AppointmentDetailsModal';

// ============ Main Patient History Component ============
export default function PatientHistory({ clinicId: propClinicId }) {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const appointmentDetailsRef = useRef(null);

  // Get clinicId from token payload (from login token claims)
  // Priority: prop > token payload > fallback to null
  const clinicId = propClinicId || getClinicIdFromToken();

  // Fetch patients by clinic
  useEffect(() => {
    if (!clinicId) {
      console.warn('⚠️ PatientHistory: No clinicId available. Prop:', propClinicId, 'Storage:', JSON.parse(localStorage.getItem('selectedAccess') || '{}')?.clinicId);
      return;
    }

    console.log('📡 PatientHistory: Fetching patients for clinicId:', clinicId);

    const fetchPatients = async () => {
      setLoading(true);
      try {
        const token = getAccessToken();
        if (!token) {
          console.warn('⚠️ PatientHistory: No authentication token found. Please login again.');
          setLoading(false);
          return;
        }
        const url = `${API_BASE_URL}/Patient/Patientsearch?clinicId=${clinicId}`;
        console.log('🔗 PatientHistory API URL:', url);
        console.log('🔐 Using token from tokenManager:', token.substring(0, 30) + '...');
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📊 PatientHistory Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ PatientHistory: Patients fetched:', data);
          setPatients(Array.isArray(data) ? data : [data].filter(p => p));
        } else {
          console.error('❌ PatientHistory: API returned status', response.status);
          const errorText = await response.text();
          console.error('❌ PatientHistory: Error response:', errorText);
        }
      } catch (err) {
        console.error('❌ PatientHistory: Error fetching patients:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [clinicId, propClinicId]);

  // Fetch appointments for selected patient
  useEffect(() => {
    if (!selectedPatient?.patientId) return;

    console.log('📡 PatientHistory: Fetching appointments for patient:', selectedPatient.patientId);

    const fetchAppointments = async () => {
      setAppointmentsLoading(true);
      try {
        const token = getAccessToken();
        if (!token) {
          console.warn('⚠️ PatientHistory: No authentication token found. Please login again.');
          setAppointmentsLoading(false);
          return;
        }
        const url = `${API_BASE_URL}/Appointment/GetAppointmentsByPatientID?patientId=${selectedPatient.patientId}`;
        console.log('🔗 PatientHistory Appointments URL:', url);
        console.log('🔐 Using token from tokenManager:', token.substring(0, 30) + '...');
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('📊 PatientHistory Appointments Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ PatientHistory: Appointments fetched:', data);
          setAppointments(Array.isArray(data) ? data : [data].filter(a => a));
          setSelectedAppointment(null);
        } else {
          console.error('❌ PatientHistory: Appointments API returned status', response.status);
          const errorText = await response.text();
          console.error('❌ PatientHistory: Error response:', errorText);
        }
      } catch (err) {
        console.error('❌ PatientHistory: Error fetching appointments:', err);
      } finally {
        setAppointmentsLoading(false);
      }
    };

    fetchAppointments();
  }, [selectedPatient]);

  // Fetch appointment details when modal opens
  const handleSelectAppointment = useCallback(async (appointment) => {
    // Only open modal if we have appointment data
    if (!appointment) return;
    
    setSelectedAppointment(appointment);
    appointmentDetailsRef.current = appointment;
    setShowDetailsModal(true);
    
    // Check if we already have full details loaded
    if (appointment.notes !== undefined && appointment.reasonForVisit !== undefined) {
      // We already have full details, no need to fetch
      setDetailsLoading(false);
      console.log('✅ PatientHistory: Using cached appointment details');
      return;
    }

    // Only fetch if we don't have full details
    setDetailsLoading(true);
    console.log('📡 PatientHistory: Fetching appointment details for:', appointment.appointmentId);

    try {
      const token = getAccessToken();
      if (!token) {
        console.warn('⚠️ PatientHistory: No authentication token found. Please login again.');
        setDetailsLoading(false);
        return;
      }
      const url = `${API_BASE_URL}/Appointment/GetAppointmentDetailsbyAppointmentID?appointmentId=${appointment.appointmentId}`;
      console.log('🔗 PatientHistory Details URL:', url);
      console.log('🔐 Using token from tokenManager:', token.substring(0, 30) + '...');
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 PatientHistory Details Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ PatientHistory: Appointment details fetched:', data);
        setSelectedAppointment(data);
        appointmentDetailsRef.current = data;
      } else {
        console.error('❌ PatientHistory: Details API returned status', response.status);
        const errorText = await response.text();
        console.error('❌ PatientHistory: Error response:', errorText);
      }
    } catch (err) {
      console.error('❌ PatientHistory: Error fetching appointment details:', err);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const handleSaveAppointment = useCallback((updatedData) => {
    // Funny messages for success
    const funnyMessages = [
      "🎉 Appointment updated! Time to celebrate!",
      "✨ Done! Your appointment just got a makeover!",
      "🚀 Whoosh! Update complete at light speed!",
      "🎊 Updated! That was smoooooth!",
      "💫 Success! The appointment gods have spoken!",
      "🌟 All set! Let's keep this patient happy!",
      "🎯 Perfect! Update landed right in the target!",
      "⚡ Lightning fast update! ⚡",
      "🔥 Sizzling update! You're on fire!",
      "🌈 Rainbow unicorn approved! ✨",
      "🎭 Appointment got a glow-up! Looking fabulous!",
      "🍰 Sweet success! This one's a keeper!",
      "🎸 Rock and roll update! Legendary move!",
      "🚁 Helicopter update complete! Nailed it!",
      "🎪 Carnival of updates! Wheeeee!",
      "👑 Royal appointment update! You're majesty!",
      "🌺 Blooming success! Fresh and fantastic!",
      "🎨 Masterpiece updated! Da Vinci approved!",
      "🏆 Championship update! Gold medal worthy!",
      "🎯 Bullseye! Nothing but net on this update!"
    ];

    setSuccessMessage(funnyMessages[Math.floor(Math.random() * funnyMessages.length)]);
    setShowSuccess(true);
    setShowDetailsModal(false);

    // Update appointments list with new data
    setAppointments(prev =>
      prev.map(apt =>
        apt.appointmentId === updatedData.appointmentId ? updatedData : apt
      )
    );
  }, []);

  return (
    <div className="w-full space-y-6">
      {/* Patients List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          👥 Clinic Patients ({patients.length})
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading patients...</p>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-lg">
            <p className="text-slate-600 text-lg">No patients found in this clinic</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <PatientTile
                key={patient.patientId}
                patient={patient}
                onSelect={setSelectedPatient}
              />
            ))}
          </div>
        )}
      </div>

      {/* Appointments for Selected Patient */}
      {selectedPatient && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-800">
              📅 Appointments for {selectedPatient.firstName} {selectedPatient.lastName}
            </h3>
            <button
              onClick={() => {
                setSelectedPatient(null);
                setAppointments([]);
                setSelectedAppointment(null);
              }}
              className="px-4 py-2 bg-slate-300 text-slate-700 rounded-lg hover:bg-slate-400 transition font-semibold"
            >
              Back
            </button>
          </div>

          <AppointmentTabsView
            appointments={appointments}
            selectedAppointment={selectedAppointment}
            onSelectAppointment={handleSelectAppointment}
            loading={appointmentsLoading}
          />
        </motion.div>
      )}

      {/* Appointment Details Modal */}
      <AppointmentDetailsModal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        appointment={selectedAppointment}
        loading={detailsLoading}
        onSave={handleSaveAppointment}
      />

      {/* Success Popup */}
      <SuccessPopup
        message={successMessage}
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
      />
    </div>
  );
}
