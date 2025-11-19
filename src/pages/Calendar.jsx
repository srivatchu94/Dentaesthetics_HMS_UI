import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Sample appointments data with time slots
const INITIAL_APPOINTMENTS = [
  { id: 1, patient: "Sarah Johnson", patientPhone: "555-0101", patientEmail: "sarah@email.com", date: "2025-11-16", startTime: "10:00", endTime: "10:30", type: "Cleaning", doctor: "Dr. Smith", status: "Confirmed", notes: "Regular cleaning", color: "emerald" },
  { id: 2, patient: "Michael Chen", patientPhone: "555-0102", patientEmail: "michael@email.com", date: "2025-11-16", startTime: "14:00", endTime: "15:30", type: "Root Canal", doctor: "Dr. Smith", status: "Confirmed", notes: "Follow-up required", color: "rose" },
  { id: 3, patient: "Emily Rodriguez", patientPhone: "555-0103", patientEmail: "emily@email.com", date: "2025-11-18", startTime: "11:00", endTime: "11:45", type: "Filling", doctor: "Dr. Smith", status: "Confirmed", notes: "Upper molar", color: "blue" },
  { id: 4, patient: "David Thompson", patientPhone: "555-0104", patientEmail: "david@email.com", date: "2025-11-20", startTime: "09:00", endTime: "09:30", type: "Checkup", doctor: "Dr. Smith", status: "Pending", notes: "Annual checkup", color: "amber" },
];

const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

const TREATMENT_TYPES = ["Cleaning", "Checkup", "Filling", "Root Canal", "Extraction", "Crown", "Braces Adjustment", "Whitening", "X-Ray", "Consultation"];

export default function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 10, 1)); // November 2025
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState("month");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showDoubleBookingModal, setShowDoubleBookingModal] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState(null);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    patientName: "",
    patientPhone: "",
    patientEmail: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "",
    doctor: "Dr. Smith",
    notes: ""
  });

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, isCurrentMonth: false, isToday: false });
    }
    
    // Current month days
    const today = new Date();
    for (let i = 1; i <= daysInMonth; i++) {
      const isToday = today.getDate() === i && today.getMonth() === month && today.getFullYear() === year;
      days.push({ day: i, isCurrentMonth: true, isToday });
    }
    
    // Next month days
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ day: i, isCurrentMonth: false, isToday: false });
    }
    
    return days;
  };

  const getAppointmentsForDate = (dateStr) => {
    return appointments.filter(apt => apt.date === dateStr);
  };

  const handleDateClick = (day) => {
    if (!day.isCurrentMonth) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setViewMode("day");
  };

  const handleSlotClick = (time, dateStr) => {
    setSelectedSlot(time);
    setBookingForm({
      ...bookingForm,
      date: dateStr,
      startTime: time,
      endTime: ""
    });
    setShowBookingModal(true);
  };

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    const newAppointment = {
      id: Date.now(),
      patient: bookingForm.patientName,
      patientPhone: bookingForm.patientPhone,
      patientEmail: bookingForm.patientEmail,
      date: bookingForm.date,
      startTime: bookingForm.startTime,
      endTime: bookingForm.endTime,
      type: bookingForm.type,
      doctor: bookingForm.doctor,
      status: "Confirmed",
      notes: bookingForm.notes,
      color: ["emerald", "blue", "violet", "rose", "amber", "indigo"][Math.floor(Math.random() * 6)]
    };
    
    // Check for existing appointments on the same date
    const existingAppointments = appointments.filter(apt => apt.date === bookingForm.date);
    
    if (existingAppointments.length > 0) {
      // Show double booking confirmation modal
      setPendingAppointment(newAppointment);
      setShowDoubleBookingModal(true);
    } else {
      // No conflicts, book directly
      confirmBooking(newAppointment);
    }
  };
  
  const confirmBooking = (appointment) => {
    setAppointments([...appointments, appointment]);
    setShowBookingModal(false);
    setShowDoubleBookingModal(false);
    setPendingAppointment(null);
    setBookingForm({
      patientName: "",
      patientPhone: "",
      patientEmail: "",
      date: "",
      startTime: "",
      endTime: "",
      type: "",
      doctor: "Dr. Smith",
      notes: ""
    });
    alert("✅ Appointment booked successfully!");
  };
  
  const cancelDoubleBooking = () => {
    setShowDoubleBookingModal(false);
    setShowBookingModal(false);
    setPendingAppointment(null);
    setBookingForm({
      patientName: "",
      patientPhone: "",
      patientEmail: "",
      date: "",
      startTime: "",
      endTime: "",
      type: "",
      doctor: "Dr. Smith",
      notes: ""
    });
  };

  const handleAppointmentDrag = (appointmentId, newStartTime) => {
    setAppointments(appointments.map(apt => {
      if (apt.id === appointmentId) {
        const startIdx = TIME_SLOTS.indexOf(apt.startTime);
        const endIdx = TIME_SLOTS.indexOf(apt.endTime);
        const duration = endIdx - startIdx;
        const newStartIdx = TIME_SLOTS.indexOf(newStartTime);
        const newEndTime = TIME_SLOTS[newStartIdx + duration];
        return { ...apt, startTime: newStartTime, endTime: newEndTime || apt.endTime };
      }
      return apt;
    }));
  };

  const isSlotBlocked = (dateStr, time) => {
    return appointments.some(apt => {
      if (apt.date !== dateStr) return false;
      const slotIdx = TIME_SLOTS.indexOf(time);
      const startIdx = TIME_SLOTS.indexOf(apt.startTime);
      const endIdx = TIME_SLOTS.indexOf(apt.endTime);
      return slotIdx >= startIdx && slotIdx < endIdx;
    });
  };

  const getAppointmentAtSlot = (dateStr, time) => {
    return appointments.find(apt => {
      if (apt.date !== dateStr) return false;
      const slotIdx = TIME_SLOTS.indexOf(time);
      const startIdx = TIME_SLOTS.indexOf(apt.startTime);
      const endIdx = TIME_SLOTS.indexOf(apt.endTime);
      return slotIdx >= startIdx && slotIdx < endIdx;
    });
  };

  const calculateSlotHeight = (startTime, endTime) => {
    const startIdx = TIME_SLOTS.indexOf(startTime);
    const endIdx = TIME_SLOTS.indexOf(endTime);
    return (endIdx - startIdx) * 60; // 60px per slot
  };

  const days = getDaysInMonth(currentDate);

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warmGray-50 to-teal-50/30 pt-[200px] px-6 pb-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-coral-600 via-peach-600 to-teal-600 bg-clip-text text-transparent mb-2">
                📅 Appointment Calendar
              </h1>
              <p className="text-gray-600">Schedule and manage appointments with drag-and-drop</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/doctors")}
              className="px-6 py-3 bg-gradient-to-r from-warmGray-500 to-warmGray-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
            >
              <span>←</span>
              <span>Back to Appointments</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Calendar Controls */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg p-6 mb-6"
        >
          <div className="flex items-center justify-between flex-wrap gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                className="p-2 rounded-lg bg-gradient-to-r from-coral-100 to-peach-100 text-coral-600 hover:from-coral-200 hover:to-peach-200 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>
              
              <h2 className="text-2xl font-bold text-gray-800 min-w-[200px] text-center">
                {viewMode === "month" ? `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}` : selectedDate}
              </h2>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                className="p-2 rounded-lg bg-gradient-to-r from-coral-100 to-peach-100 text-coral-600 hover:from-coral-200 hover:to-peach-200 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </div>

            {/* View Mode & Today Button */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCurrentDate(new Date());
                  setViewMode("month");
                }}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-gold-500 to-peach-500 text-white font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Today
              </motion.button>
              
              {viewMode === "day" && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode("month")}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-coral-500 to-peach-500 text-white font-semibold shadow-coral hover:shadow-lg transition-all"
                >
                  Back to Month
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Month View */}
        {viewMode === "month" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="grid grid-cols-7 gap-2 mb-4">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center font-bold text-gray-700 py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day, idx) => {
                const dateStr = day.isCurrentMonth 
                  ? `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`
                  : null;
                const dayAppointments = dateStr ? getAppointmentsForDate(dateStr) : [];
                const hasAppointments = dayAppointments.length > 0;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.01 }}
                    onClick={() => handleDateClick(day)}
                    className={`min-h-[100px] rounded-xl p-2 border-2 transition-all cursor-pointer ${
                      day.isCurrentMonth
                        ? day.isToday
                          ? "bg-gradient-to-br from-coral-100 to-peach-100 border-coral-400 shadow-coral"
                          : hasAppointments
                          ? "bg-gradient-to-br from-cream-50 to-warmGray-50 border-warmGray-200 hover:border-coral-400 hover:shadow-md"
                          : "bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm"
                        : "bg-gray-50 border-gray-100"
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${
                      day.isCurrentMonth
                        ? day.isToday
                          ? "text-indigo-700"
                          : "text-gray-700"
                        : "text-gray-400"
                    }`}>
                      {day.day}
                    </div>

                    {day.isCurrentMonth && dayAppointments.slice(0, 2).map((apt) => (
                      <div
                        key={apt.id}
                        className={`text-xs px-2 py-1 rounded-md mb-1 bg-${apt.color}-100 text-${apt.color}-700 font-medium truncate`}
                      >
                        {apt.startTime} - {apt.patient}
                      </div>
                    ))}

                    {day.isCurrentMonth && dayAppointments.length > 2 && (
                      <div className="text-xs text-purple-600 font-semibold">
                        +{dayAppointments.length - 2} more
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Day View with Time Slots */}
        {viewMode === "day" && selectedDate && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                Schedule for {selectedDate}
              </h3>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setBookingForm({ ...bookingForm, date: selectedDate });
                  setShowBookingModal(true);
                }}
                className="px-6 py-3 bg-gradient-to-r from-teal-500 to-sage-500 text-white rounded-xl font-semibold shadow-teal hover:shadow-xl transition-all flex items-center gap-2"
              >
                <span>➕</span>
                <span>New Appointment</span>
              </motion.button>
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {TIME_SLOTS.map((time) => {
                const appointment = getAppointmentAtSlot(selectedDate, time);
                const isBlocked = isSlotBlocked(selectedDate, time);
                const isStartOfAppointment = appointment && appointment.startTime === time;

                return (
                  <div key={time} className="relative">
                    {isStartOfAppointment ? (
                      <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.1}
                        onDragEnd={(e, info) => {
                          const dragDistance = info.offset.y;
                          const slotsMoved = Math.round(dragDistance / 60);
                          if (slotsMoved !== 0) {
                            const currentIdx = TIME_SLOTS.indexOf(time);
                            const newIdx = Math.max(0, Math.min(TIME_SLOTS.length - 1, currentIdx + slotsMoved));
                            handleAppointmentDrag(appointment.id, TIME_SLOTS[newIdx]);
                          }
                        }}
                        whileHover={{ scale: 1.02, zIndex: 10 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(appointment);
                          setShowAppointmentModal(true);
                        }}
                        className={`absolute w-full z-10 cursor-move`}
                        style={{ height: calculateSlotHeight(appointment.startTime, appointment.endTime) }}
                      >
                        <div className={`h-full bg-gradient-to-r from-${appointment.color}-400 to-${appointment.color}-500 rounded-lg p-3 shadow-lg border-2 border-${appointment.color}-600 hover:shadow-xl transition-all`}>
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-bold text-white text-sm">{appointment.patient}</p>
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                          </div>
                          <p className="text-xs text-white opacity-90">{appointment.type}</p>
                          <p className="text-xs text-white opacity-90">{appointment.startTime} - {appointment.endTime}</p>
                        </div>
                      </motion.div>
                    ) : !isBlocked && (
                      <motion.button
                        whileHover={{ backgroundColor: "#f3e8ff", scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => handleSlotClick(time, selectedDate)}
                        className="w-full h-[60px] border-2 border-gray-200 rounded-lg flex items-center px-4 hover:border-purple-400 transition-all group"
                      >
                        <span className="text-sm font-semibold text-gray-600 group-hover:text-purple-600">{time}</span>
                        <span className="ml-auto text-xs text-gray-400 group-hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-opacity">Click to book</span>
                      </motion.button>
                    )}
                    
                    {isBlocked && !isStartOfAppointment && (
                      <div className="w-full h-[60px] border-2 border-transparent rounded-lg"></div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Booking Modal */}
        <AnimatePresence>
          {showBookingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-3xl font-bold bg-gradient-to-r from-coral-600 to-peach-600 bg-clip-text text-transparent">
                    Book New Appointment
                  </h3>
                  <button
                    onClick={() => setShowBookingModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Patient Name *</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.patientName}
                        onChange={(e) => setBookingForm({ ...bookingForm, patientName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={bookingForm.patientPhone}
                        onChange={(e) => setBookingForm({ ...bookingForm, patientPhone: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        placeholder="555-0123"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={bookingForm.patientEmail}
                      onChange={(e) => setBookingForm({ ...bookingForm, patientEmail: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                      placeholder="patient@email.com"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Date *</label>
                      <input
                        type="date"
                        required
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
                      <select
                        required
                        value={bookingForm.startTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                      >
                        <option value="">Select</option>
                        {TIME_SLOTS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
                      <select
                        required
                        value={bookingForm.endTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                      >
                        <option value="">Select</option>
                        {TIME_SLOTS.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Treatment Type *</label>
                      <select
                        required
                        value={bookingForm.type}
                        onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                      >
                        <option value="">Select treatment</option>
                        {TREATMENT_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Doctor</label>
                      <input
                        type="text"
                        value={bookingForm.doctor}
                        onChange={(e) => setBookingForm({ ...bookingForm, doctor: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all"
                        placeholder="Dr. Smith"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Notes</label>
                    <textarea
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-400 focus:ring-4 focus:ring-purple-100 outline-none transition-all resize-none"
                      placeholder="Any special notes or requirements..."
                    />
                  </div>

                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-4 bg-gradient-to-r from-coral-500 to-peach-500 text-white rounded-xl font-bold text-lg shadow-coral hover:shadow-2xl transition-all"
                  >
                    Book Appointment
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Appointment Details Modal */}
        <AnimatePresence>
          {showAppointmentModal && selectedAppointment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAppointmentModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-sage-600 bg-clip-text text-transparent">
                    Appointment Details
                  </h3>
                  <button
                    onClick={() => setShowAppointmentModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Patient</p>
                    <p className="text-lg font-semibold text-gray-800">{selectedAppointment.patient}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phone</p>
                      <p className="font-semibold text-gray-800">{selectedAppointment.patientPhone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="font-semibold text-gray-800 text-sm">{selectedAppointment.patientEmail}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Date</p>
                      <p className="font-semibold text-gray-800">{selectedAppointment.date}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Time</p>
                      <p className="font-semibold text-gray-800">{selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Treatment Type</p>
                    <p className="font-semibold text-gray-800">{selectedAppointment.type}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Doctor</p>
                    <p className="font-semibold text-gray-800">{selectedAppointment.doctor}</p>
                  </div>

                  {selectedAppointment.notes && (
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Notes</p>
                      <p className="text-gray-700">{selectedAppointment.notes}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedAppointment.status === "Confirmed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {selectedAppointment.status}
                    </span>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setAppointments(appointments.filter(apt => apt.id !== selectedAppointment.id));
                      setShowAppointmentModal(false);
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    Cancel Appointment
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Double Booking Confirmation Modal */}
        <AnimatePresence>
          {showDoubleBookingModal && pendingAppointment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
              onClick={() => setShowDoubleBookingModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">⚠️</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      Double Booking Detected
                    </h3>
                    <p className="text-gray-600 text-sm">
                      There are already {appointments.filter(apt => apt.date === pendingAppointment.date).length} appointment(s) scheduled on <strong>{pendingAppointment.date}</strong>.
                    </p>
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-amber-800 mb-2">
                    <strong>Existing appointments on this date:</strong>
                  </p>
                  <div className="space-y-2">
                    {appointments.filter(apt => apt.date === pendingAppointment.date).map(apt => (
                      <div key={apt.id} className="text-sm text-amber-700 bg-white/50 px-3 py-2 rounded">
                        • {apt.patient} - {apt.startTime} to {apt.endTime} ({apt.type})
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-6">
                  Would you like to proceed with double booking this appointment?
                </p>

                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={cancelDoubleBooking}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                  >
                    No, Go Back
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => confirmBooking(pendingAppointment)}
                    className="flex-1 py-3 bg-gradient-to-r from-coral-500 to-peach-500 text-white rounded-xl font-semibold shadow-coral hover:shadow-xl transition-all"
                  >
                    Yes, Double Book
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
