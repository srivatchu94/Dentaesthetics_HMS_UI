import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FancyDatePicker from '../components/FancyDatePicker';
import DiagnosisModal from '../components/DiagnosisModal';

const API_BASE_URL = import.meta.env?.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

export default function DoctorSchedule() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [diagnosisData, setDiagnosisData] = useState(null);
  const [doctorId, setDoctorId] = useState(null);
  const [clinicId, setClinicId] = useState(null);

  // Get doctor ID from local storage on mount
  useEffect(() => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        setDoctorId(parsed.doctorId || parsed.id);
        setClinicId(parsed.clinicId);
      } catch (e) {
        console.log('Error parsing userData');
      }
    }
  }, []);

  // Fetch appointments when date changes
  useEffect(() => {
    if (doctorId && selectedDate) {
      fetchAppointments();
    }
  }, [selectedDate, doctorId]);

  const fetchAppointments = async () => {
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
  };

  const handleViewDetails = (appointment) => {
    setSelectedAppointment(appointment);
    setEditForm({ ...appointment });
    setShowDetailModal(true);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setEditForm({ ...selectedAppointment });
    }
    setIsEditing(!isEditing);
  };

  const handleEditChange = (field, value) => {
    setEditForm({ ...editForm, [field]: value });
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Appointment/${selectedAppointment.appointmentId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(editForm)
        }
      );

      if (response.ok) {
        setSelectedAppointment(editForm);
        setIsEditing(false);
        await fetchAppointments();
      } else {
        setError('Failed to update appointment');
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      setError('Error updating appointment');
    }
  };

  const handleOpenDiagnosis = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Diagnosis/GetDiagnosisByAppointmentId?appointmentId=${selectedAppointment.appointmentId}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setDiagnosisData(data);
      } else {
        setDiagnosisData(null);
      }
    } catch (err) {
      console.error('Error fetching diagnosis:', err);
    }
    setShowDiagnosisModal(true);
  };

  const getStatusColor = (status) => {
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
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            📅 Doctor Schedule
          </h1>
          <p className="text-slate-600">View and manage your appointments</p>
        </div>

        {/* Date Picker and Search */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-6 mb-8 border-2 border-purple-200"
        >
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Select Date</label>
              <FancyDatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                label=""
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchAppointments}
              className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all mt-6 md:mt-0"
            >
              🔍 Search
            </motion.button>
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
            className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 mb-8"
          >
            {error}
          </motion.div>
        )}

        {/* Appointments List */}
        {!loading && appointments.length > 0 && (
          <motion.div className="space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              {appointments.length} appointment{appointments.length !== 1 ? 's' : ''} found
            </h2>
            {appointments.map((appointment, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => handleViewDetails(appointment)}
                className="cursor-pointer"
              >
                <div className={`bg-gradient-to-r ${getStatusColor(appointment.status)} p-1 rounded-2xl shadow-lg hover:shadow-xl transition-all transform hover:scale-102`}>
                  <div className="bg-white rounded-xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={`w-12 h-12 bg-gradient-to-r ${getStatusColor(appointment.status)} rounded-full flex items-center justify-center text-white font-bold`}>
                          {appointment.appointmentId % 10}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-bold text-slate-800">
                            {appointment.firstName} {appointment.lastName}
                          </h3>
                          <p className="text-sm text-slate-600">
                            🏥 Clinic: {appointment.clinicName || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r ${getStatusColor(appointment.status)}`}>
                          {appointment.status || 'Scheduled'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-600">Date & Time</p>
                        <p className="font-semibold text-slate-800">
                          {new Date(appointment.appointmentDate).toLocaleDateString()} {appointment.startTime}
                        </p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-600">Duration</p>
                        <p className="font-semibold text-slate-800">{appointment.durationMinutes} mins</p>
                      </div>
                      <div className="bg-pink-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-600">Type</p>
                        <p className="font-semibold text-slate-800">{appointment.appointmentType || 'Regular'}</p>
                      </div>
                      <div className="bg-indigo-50 p-3 rounded-lg">
                        <p className="text-xs text-slate-600">Room</p>
                        <p className="font-semibold text-slate-800">#{appointment.roomNumber || 'N/A'}</p>
                      </div>
                    </div>

                    {appointment.reasonForVisit && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg border-l-4 border-purple-600">
                        <p className="text-xs text-slate-600">Reason for Visit</p>
                        <p className="text-slate-800">{appointment.reasonForVisit}</p>
                      </div>
                    )}
                  </div>
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
            className="text-center py-16 bg-white rounded-2xl shadow-lg border-2 border-purple-200"
          >
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">No appointments found</h3>
            <p className="text-slate-600">Try selecting a different date</p>
          </motion.div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedAppointment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-200"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 sticky top-0 flex items-center justify-between text-white">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedAppointment.firstName} {selectedAppointment.lastName}
                  </h2>
                  <p className="text-purple-100">Appointment Details</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-2xl hover:bg-white/20 p-2 rounded-full transition"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    👤 Patient Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-xs text-slate-600">Phone</p>
                      <p className="font-semibold text-slate-800">{selectedAppointment.phoneNumber}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <p className="text-xs text-slate-600">Email</p>
                      <p className="font-semibold text-slate-800 truncate">{selectedAppointment.email}</p>
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    📅 Appointment Details
                  </h3>
                  <div className="space-y-3">
                    {isEditing ? (
                      <>
                        <div>
                          <label className="text-sm font-semibold text-slate-700">Reason for Visit</label>
                          <textarea
                            value={editForm.reasonForVisit || ''}
                            onChange={(e) => handleEditChange('reasonForVisit', e.target.value)}
                            className="w-full p-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                            rows="3"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-semibold text-slate-700">Status</label>
                          <select
                            value={editForm.status || 'Scheduled'}
                            onChange={(e) => handleEditChange('status', e.target.value)}
                            className="w-full p-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500"
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
                          <p className="text-xs text-slate-600">Date & Time</p>
                          <p className="font-semibold text-slate-800">
                            {new Date(selectedAppointment.appointmentDate).toLocaleDateString()} {selectedAppointment.startTime} - {selectedAppointment.endTime}
                          </p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-xs text-slate-600">Reason for Visit</p>
                          <p className="font-semibold text-slate-800">{selectedAppointment.reasonForVisit || 'N/A'}</p>
                        </div>
                        <div className="bg-pink-50 p-4 rounded-lg">
                          <p className="text-xs text-slate-600">Status</p>
                          <p className="font-semibold text-slate-800">{selectedAppointment.status || 'Scheduled'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t-2 border-purple-200">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleEditToggle}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition"
                  >
                    {isEditing ? '❌ Cancel' : '✏️ Edit'}
                  </motion.button>

                  {isEditing && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSaveEdit}
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:shadow-lg transition"
                    >
                      💾 Save
                    </motion.button>
                  )}

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleOpenDiagnosis}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg font-bold hover:shadow-lg transition"
                  >
                    🏥 Diagnosis
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diagnosis Modal */}
      {showDiagnosisModal && (
        <DiagnosisModal
          isOpen={showDiagnosisModal}
          onClose={() => setShowDiagnosisModal(false)}
          appointmentId={selectedAppointment?.appointmentId}
          initialData={diagnosisData}
          onSave={() => {
            setShowDiagnosisModal(false);
            setShowDetailModal(false);
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
}
