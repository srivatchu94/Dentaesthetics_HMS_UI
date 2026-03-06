import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getSelectedAccess } from "../services/authService";
import { getAppointmentsByDate, getAppointmentById, updateAppointment } from "../services/appointmentService";
import FancyDatePicker from "./FancyDatePicker";

// Memoized Detail Modal Form Component
const AppointmentDetailsForm = React.memo(({ 
  editForm, 
  onEditFormChange, 
  editMode, 
  onEditModeToggle, 
  onSaveChanges, 
  onCancel,
  onClose,
  savingChanges,
  appointmentDetails
}) => {
  // Use useCallback for onChange handlers to prevent re-renders
  const handleFirstNameChange = useCallback((e) => {
    onEditFormChange({ ...editForm, firstName: e.target.value });
  }, [editForm, onEditFormChange]);

  const handleLastNameChange = useCallback((e) => {
    onEditFormChange({ ...editForm, lastName: e.target.value });
  }, [editForm, onEditFormChange]);

  const handleContactNumberChange = useCallback((e) => {
    onEditFormChange({ ...editForm, contactNumber: e.target.value });
  }, [editForm, onEditFormChange]);

  const handleAppointmentDateChange = useCallback((e) => {
    onEditFormChange({ ...editForm, appointmentDate: e.target.value });
  }, [editForm, onEditFormChange]);

  const handleAppointmentTimeChange = useCallback((e) => {
    onEditFormChange({ ...editForm, appointmentTime: e.target.value });
  }, [editForm, onEditFormChange]);

  const handleStatusChange = useCallback((e) => {
    onEditFormChange({ ...editForm, appointmentStatus: e.target.value });
  }, [editForm, onEditFormChange]);

  const handleNotesChange = useCallback((e) => {
    onEditFormChange({ ...editForm, notes: e.target.value });
  }, [editForm, onEditFormChange]);

  return (
    <div className="p-6 space-y-4">
      {/* Patient Information */}
      <div className="bg-blue-50 rounded-2xl p-5 border-2 border-blue-200">
        <h3 className="text-lg font-bold text-blue-900 mb-4">👤 Patient Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-blue-700 mb-1">First Name</label>
            <input
              type="text"
              value={editForm.firstName || ""}
              onChange={handleFirstNameChange}
              disabled={!editMode}
              className={`w-full px-3 py-2 border-2 border-blue-200 rounded-lg outline-none transition-all ${
                editMode ? "bg-white focus:border-blue-500" : "bg-gray-50 text-gray-600 cursor-not-allowed"
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-blue-700 mb-1">Last Name</label>
            <input
              type="text"
              value={editForm.lastName || ""}
              onChange={handleLastNameChange}
              disabled={!editMode}
              className={`w-full px-3 py-2 border-2 border-blue-200 rounded-lg outline-none transition-all ${
                editMode ? "bg-white focus:border-blue-500" : "bg-gray-50 text-gray-600 cursor-not-allowed"
              }`}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-blue-700 mb-1">Contact Number</label>
            <input
              type="tel"
              value={editForm.contactNumber || ""}
              onChange={handleContactNumberChange}
              disabled={!editMode}
              className={`w-full px-3 py-2 border-2 border-blue-200 rounded-lg outline-none transition-all ${
                editMode ? "bg-white focus:border-blue-500" : "bg-gray-50 text-gray-600 cursor-not-allowed"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Appointment Information */}
      <div className="bg-purple-50 rounded-2xl p-5 border-2 border-purple-200">
        <h3 className="text-lg font-bold text-purple-900 mb-4">📅 Appointment Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-purple-700 mb-1">Date</label>
            <input
              type="date"
              value={editForm.appointmentDate || ""}
              onChange={handleAppointmentDateChange}
              disabled={!editMode}
              className={`w-full px-3 py-2 border-2 border-purple-200 rounded-lg outline-none transition-all ${
                editMode ? "bg-white focus:border-purple-500" : "bg-gray-50 text-gray-600 cursor-not-allowed"
              }`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-purple-700 mb-1">Time</label>
            <input
              type="time"
              value={editForm.appointmentTime || ""}
              onChange={handleAppointmentTimeChange}
              disabled={!editMode}
              className={`w-full px-3 py-2 border-2 border-purple-200 rounded-lg outline-none transition-all ${
                editMode ? "bg-white focus:border-purple-500" : "bg-gray-50 text-gray-600 cursor-not-allowed"
              }`}
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-purple-700 mb-1">Status</label>
            <select
              value={editForm.appointmentStatus || ""}
              onChange={handleStatusChange}
              disabled={!editMode}
              className={`w-full px-3 py-2 border-2 border-purple-200 rounded-lg outline-none transition-all ${
                editMode ? "bg-white focus:border-purple-500" : "bg-gray-50 text-gray-600 cursor-not-allowed"
              }`}
            >
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-amber-50 rounded-2xl p-5 border-2 border-amber-200">
        <h3 className="text-lg font-bold text-amber-900 mb-4">📝 Notes</h3>
        <textarea
          value={editForm.notes || ""}
          onChange={handleNotesChange}
          disabled={!editMode}
          rows={3}
          className={`w-full px-3 py-2 border-2 border-amber-200 rounded-lg outline-none transition-all resize-none ${
            editMode ? "bg-white focus:border-amber-500" : "bg-gray-50 text-gray-600 cursor-not-allowed"
          }`}
          placeholder="Add appointment notes here..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        {!editMode ? (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEditModeToggle(true)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold rounded-lg hover:shadow-lg transition-all"
            >
              ✏️ Edit Appointment
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition-all"
            >
              ✕ Close
            </motion.button>
          </>
        ) : (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onSaveChanges}
              disabled={savingChanges}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingChanges ? "💾 Saving..." : "💾 Save Changes"}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancel}
              disabled={savingChanges}
              className="flex-1 px-6 py-3 bg-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↩️ Cancel
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
});

AppointmentDetailsForm.displayName = 'AppointmentDetailsForm';

// Memoized Appointment Card Component
const AppointmentCard = React.memo(({ appointment, onViewDetails, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border-2 border-indigo-200 hover:border-indigo-400 transition-all shadow-md hover:shadow-lg"
    >
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-600 font-semibold">PATIENT</p>
          <p className="text-lg font-bold text-indigo-900">
            {appointment.firstName} {appointment.lastName}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-semibold">TIME</p>
          <p className="text-base font-bold text-purple-600">
            {appointment.appointmentTime || "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 font-semibold">DOCTOR</p>
          <p className="text-sm text-gray-700">
            {appointment.doctorName || "Not assigned"}
          </p>
        </div>
        <div>
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
            appointment.appointmentStatus === 'Confirmed'
              ? 'bg-green-100 text-green-800'
              : appointment.appointmentStatus === 'Pending'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {appointment.appointmentStatus || "Pending"}
          </span>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onViewDetails(appointment)}
          className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg transition-all"
        >
          👁️ View Details
        </motion.button>
      </div>
    </motion.div>
  );
});

AppointmentCard.displayName = 'AppointmentCard';

// Memoized Appointments Grid Component
const AppointmentsGrid = React.memo(({ appointments, onViewDetails }) => {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span>📋</span> Appointments ({appointments.length})
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {appointments.map((appointment, index) => (
          <AppointmentCard
            key={appointment.appointmentId || index}
            appointment={appointment}
            onViewDetails={onViewDetails}
            index={index}
          />
        ))}
      </div>
    </div>
  );
});

AppointmentsGrid.displayName = 'AppointmentsGrid';

const ScheduleAppointmentsModal = ({ isOpen, onClose }) => {
  // State declarations
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
  // Detail modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [savingChanges, setSavingChanges] = useState(false);
  
  // Success modal state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const [funnyMessages] = useState([
    "🎉 Boom! Your appointment has been updated!",
    "✨ Done like a pro! Your changes are saved!",
    "🚀 Faster than a speeding bullet! Update complete!",
    "💪 Champion-level update right here!",
    "🎪 Tadaa! Your appointment is now updated!",
    "🌟 Shining bright! Changes saved successfully!",
    "🎯 Bullseye! Perfect appointment update!",
    "🏆 You're a wizard! Appointment updated!",
    "🎭 Plot twist: Your appointment is updated!",
    "🌈 Rainbow of success! Changes applied!"
  ]);

  // Effects
  useEffect(() => {
    if (isOpen) {
      fetchAppointments();
    }
  }, [isOpen, selectedDate]);

  // Fetch appointments
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const selectedAccess = getSelectedAccess();
      if (!selectedAccess?.enterpriseId || !selectedAccess?.clinicId) {
        setErrorMessage("Unable to fetch clinic information. Please refresh and try again.");
        setLoading(false);
        return;
      }
      const data = await getAppointmentsByDate(selectedAccess.enterpriseId, selectedAccess.clinicId, selectedDate);
      setAppointments(data || []);
      if (!data || data.length === 0) {
        setErrorMessage(`No appointments scheduled for ${new Date(selectedDate).toLocaleDateString()}`);
      }
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setErrorMessage("Failed to load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // View appointment details
  const handleViewDetails = useCallback(async (appointment) => {
    setLoadingDetails(true);
    setEditMode(false);
    setAppointmentDetails(null);
    setErrorMessage("");
    try {
      const selectedAccess = getSelectedAccess();
      let appointmentDateFormatted = appointment.appointmentDate;
      if (appointmentDateFormatted && appointmentDateFormatted.includes('T')) {
        appointmentDateFormatted = appointmentDateFormatted.split('T')[0];
      }
      
      let doctorIdParam = null;
      if (appointment.doctorId) {
        if (typeof appointment.doctorId === 'string' && !isNaN(parseInt(appointment.doctorId))) {
          doctorIdParam = parseInt(appointment.doctorId);
        } else if (typeof appointment.doctorId === 'number') {
          doctorIdParam = appointment.doctorId;
        }
      }
      
      const requestParams = {
        clinicId: selectedAccess?.clinicId,
        firstName: appointment.firstName,
        lastName: appointment.lastName,
        doctorId: doctorIdParam,
        appointmentDate: appointmentDateFormatted
      };
      
      const details = await getAppointmentById(requestParams);
      setAppointmentDetails(details);
      setEditForm(details || {});
      setShowDetailModal(true);
    } catch (error) {
      console.error("Error fetching appointment details:", error);
      setErrorMessage("Failed to load appointment details. Please try again.");
    } finally {
      setLoadingDetails(false);
    }
  }, []);

  const handleSaveChanges = useCallback(async () => {
    setSavingChanges(true);
    setErrorMessage("");
    try {
      const result = await updateAppointment(editForm);
      if (result) {
        const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
        setSuccessMessage(randomMessage);
        setShowSuccessModal(true);
        setAppointments(appointments.map(appt => appt.appointmentId === editForm.appointmentId ? editForm : appt));
        setTimeout(() => {
          setShowDetailModal(false);
          setShowSuccessModal(false);
          setEditMode(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error updating appointment:", error);
      setErrorMessage("Failed to save changes. Please try again.");
    } finally {
      setSavingChanges(false);
    }
  }, [editForm, appointments, funnyMessages]);

  // Change handlers with useCallback
  const handleEditFormChange = useCallback((newForm) => {
    setEditForm(newForm);
  }, []);

  const handleEditModeToggle = useCallback((mode) => {
    setEditMode(mode);
  }, []);

  const handleDetailCancel = useCallback(() => {
    setEditMode(false);
    setEditForm(appointmentDetails);
  }, [appointmentDetails]);

  const handleDetailClose = useCallback(() => {
    setShowDetailModal(false);
  }, []);

  if (!isOpen) return null;

  // Render main modal
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 p-6 text-white z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">📅</span>
                  <div>
                    <h2 className="text-2xl font-bold">Schedule & Appointments</h2>
                    <p className="text-purple-100 text-sm">View and manage your appointments</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="p-6 space-y-6">
              {/* Date Picker Section */}
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl p-5 border-2 border-violet-200">
                <h3 className="text-lg font-bold text-violet-900 mb-4 flex items-center gap-2">
                  <span>📆</span> Select Date
                </h3>
                <FancyDatePicker
                  label="Appointment Date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg"
                >
                  <p className="text-red-800 font-semibold">⚠️ {errorMessage}</p>
                </motion.div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex justify-center items-center py-12">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                    <span className="text-5xl">⏳</span>
                  </motion.div>
                </div>
              )}

              {/* Appointments Grid */}
              {!loading && appointments.length > 0 && (
                <AppointmentsGrid 
                  appointments={appointments} 
                  onViewDetails={handleViewDetails}
                />
              )}

              {/* No Appointments State */}
              {!loading && appointments.length === 0 && !errorMessage && (
                <div className="text-center py-12">
                  <span className="text-6xl">😊</span>
                  <p className="text-gray-600 mt-4 text-lg">No appointments scheduled for this date</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Details Modal */}
          <AnimatePresence>
            {showDetailModal && appointmentDetails && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                onClick={() => !savingChanges && setShowDetailModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                >
                  {/* Detail Modal Header */}
                  <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 p-6 text-white z-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold">Appointment Details</h2>
                        <p className="text-blue-100 text-sm">
                          {editMode ? "Edit appointment information" : "View appointment details"}
                        </p>
                      </div>
                      <button
                        onClick={() => !savingChanges && setShowDetailModal(false)}
                        className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Loading Details */}
                  {loadingDetails && (
                    <div className="flex justify-center items-center py-12">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                        <span className="text-5xl">⏳</span>
                      </motion.div>
                    </div>
                  )}

                  {/* Details Content */}
                  {!loadingDetails && (
                    <AppointmentDetailsForm
                      editForm={editForm}
                      onEditFormChange={handleEditFormChange}
                      editMode={editMode}
                      onEditModeToggle={handleEditModeToggle}
                      onSaveChanges={handleSaveChanges}
                      onCancel={handleDetailCancel}
                      onClose={handleDetailClose}
                      savingChanges={savingChanges}
                      appointmentDetails={appointmentDetails}
                    />
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Modal - Outside detail modal */}
          <AnimatePresence>
            {showSuccessModal && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed inset-0 flex items-center justify-center z-[70]"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0]
                  }}
                  transition={{ duration: 1 }}
                  className="bg-gradient-to-br from-green-400 to-emerald-500 text-white px-8 py-6 rounded-3xl shadow-2xl text-center"
                >
                  <p className="text-3xl font-bold">{successMessage}</p>
                  <p className="text-lg mt-2">✨</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScheduleAppointmentsModal;
