import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { getCalendarAppointments, updateAppointment, createAppointment } from "../services/appointmentService";
import FancyDatePicker from "../components/FancyDatePicker";
import PaymentDetailsModal from "../components/PaymentDetailsModal";

// Time slots for booking
const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30", "18:00"
];

const TREATMENT_TYPES = ["Cleaning", "Checkup", "Filling", "Root Canal", "Extraction", "Crown", "Braces Adjustment", "Whitening", "X-Ray", "Consultation"];
const APPOINTMENT_COLORS = ["emerald", "blue", "violet", "rose", "amber", "indigo"];

export default function Calendar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get patient data from navigation state (React Router v6)
  const patientFromNav = location.state?.patientData || window.history.state?.usr?.patientData;
  
  const [currentDate, setCurrentDate] = useState(new Date()); // Today's date
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState("month");
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showDoubleBookingModal, setShowDoubleBookingModal] = useState(false);
  const [pendingAppointment, setPendingAppointment] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isBookingLoading, setIsBookingLoading] = useState(false);
  const [isEditingAppointment, setIsEditingAppointment] = useState(false);
  const [editFormData, setEditFormData] = useState({
    patient: "",
    patientPhone: "",
    patientEmail: "",
    date: "",
    startTime: "",
    endTime: "",
    type: "",
    doctor: "",
    notes: "",
    billableAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    status: "",
    paymentStatus: "",
    reasonForVisit: ""
  });
  const [updatingAppointment, setUpdatingAppointment] = useState(false);
  const [showPaymentDetailsModal, setShowPaymentDetailsModal] = useState(false);
  const [paymentModalAppointment, setPaymentModalAppointment] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  const mapApiAppointmentToCalendar = (apt) => ({
    id: apt.appointmentId,
    appointmentId: apt.appointmentId,
    patient: `${apt.firstName || ''} ${apt.lastName || ''}`.trim(),
    firstName: apt.firstName || '',
    lastName: apt.lastName || '',
    patientPhone: apt.phoneNumber || '',
    patientEmail: apt.email || '',
    date: apt.appointmentDate ? apt.appointmentDate.split('T')[0] : '',
    startTime: apt.startTime || '',
    endTime: apt.endTime || '',
    type: apt.appointmentType || '',
    doctor: apt.attendingPhysician || 'Dr. Smith',
    status: apt.status || 'Confirmed',
    notes: apt.notes || '',
    billableAmount: apt.billableAmount || 0,
    paidAmount: apt.paidAmount || 0,
    pendingAmount: apt.pendingAmount || 0,
    paymentStatus: apt.paymentStatus || 'Pending',
    patientId: apt.patientId,
    clinicId: apt.clinicId,
    doctorId: apt.doctorId,
    enterpriseId: apt.enterpriseId,
    reasonForVisit: apt.reasonForVisit || '',
    invoiceNumber: apt.invoiceNumber || null,
    color: 'emerald'
  });

  const loadAppointments = async () => {
    try {
      setLoadingAppointments(true);
      console.log('📅 Loading calendar appointments from API...');
      const data = await getCalendarAppointments();

      const transformedAppointments = data.map(mapApiAppointmentToCalendar);
      console.log('✅ Loaded appointments:', transformedAppointments);
      setAppointments(transformedAppointments);
    } catch (error) {
      console.error('❌ Error loading appointments:', error);
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  };
  
  // Booking form state - pre-fill with patient data if available
  const [bookingForm, setBookingForm] = useState({
    patientName: patientFromNav?.patientName || "",
    patientPhone: patientFromNav?.patientPhone || "",
    patientEmail: patientFromNav?.patientEmail || "",
    date: "",
    startTime: "",
    endTime: "",
    durationMinutes: 30,
    type: "",
    doctor: "Dr. Smith",
    reasonForVisit: "",
    notes: patientFromNav ? `Patient ID: ${patientFromNav.patientId} | DOB: ${patientFromNav.patientDOB ? new Date(patientFromNav.patientDOB).toLocaleDateString() : 'N/A'} | Gender: ${patientFromNav.patientGender || 'N/A'}` : "",
    billableAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    roomNumber: "",
    telehealthLink: "",
    appointmentStatus: "Scheduled",
    paymentStatus: "Pending",
    isConfirmed: false
  });
  
  // Auto-open booking modal if patient data is provided
  React.useEffect(() => {
    if (patientFromNav) {
      setShowBookingModal(true);
    }
  }, [patientFromNav]);

  // Load appointments from API
  useEffect(() => {
    loadAppointments();
  }, []);

  // Check if appointment is in the past
  const isAppointmentInPast = (appointmentDate) => {
    if (!appointmentDate) return false;
    const apptDate = new Date(appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    apptDate.setHours(0, 0, 0, 0);
    return apptDate < today;
  };

  // Normalize time to HH:mm format
  const normalizeTime = (time) => {
    if (!time) return '08:00';
    if (time.match(/^\d{2}:\d{2}$/)) return time;
    if (time.match(/^\d{2}:\d{2}:\d{2}$/)) return time.substring(0, 5);
    return '08:00';
  };

  // Process appointments with normalized times
  // For same date + same start time slots, assign different colors to distinguish cards.
  const processedAppointments = React.useMemo(() => {
    const normalizedAppointments = appointments.map((apt) => ({
      ...apt,
      startTime: normalizeTime(apt.startTime),
      endTime: normalizeTime(apt.endTime) || normalizeTime(apt.startTime)
    }));

    const slotTotals = new Map();
    const slotUsage = new Map();

    normalizedAppointments.forEach((apt) => {
      const key = `${apt.date}-${apt.startTime}`;
      slotTotals.set(key, (slotTotals.get(key) || 0) + 1);
    });

    return normalizedAppointments.map((apt) => {
      const key = `${apt.date}-${apt.startTime}`;
      const slotIndex = slotUsage.get(key) || 0;
      slotUsage.set(key, slotIndex + 1);

      const hasCollisionsInSlot = (slotTotals.get(key) || 0) > 1;
      return {
        ...apt,
        color: hasCollisionsInSlot
          ? APPOINTMENT_COLORS[slotIndex % APPOINTMENT_COLORS.length]
          : (apt.color || "emerald")
      };
    });
  }, [appointments]);

  // Handle updating appointment details
  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return;
    
    try {
      setUpdatingAppointment(true);
      console.log('📝 Updating appointment details...');
      
      // Convert time strings HH:mm to HH:mm:ss format required by backend
      const convertTimeToTimeSpan = (timeStr) => {
        if (!timeStr) return "00:00:00";
        if (timeStr.includes(':')) {
          const parts = timeStr.split(':');
          if (parts.length === 2) {
            return `${parts[0]}:${parts[1]}:00`;
          }
          return timeStr;
        }
        return "00:00:00";
      };
      
      // Prepare update payload - complete AppointmentsModel for backend
      const updatePayload = {
        appointmentId: selectedAppointment.id,
        patientId: selectedAppointment.patientId,
        clinicId: selectedAppointment.clinicId,
        doctorId: selectedAppointment.doctorId ? String(selectedAppointment.doctorId) : null,
        enterpriseId: selectedAppointment.enterpriseId,
        firstName: editFormData.patient.split(' ')[0] || "",
        lastName: editFormData.patient.split(' ').slice(1).join(' ') || "",
        phoneNumber: editFormData.patientPhone,
        email: editFormData.patientEmail,
        appointmentDate: editFormData.date,
        startTime: convertTimeToTimeSpan(editFormData.startTime),
        endTime: convertTimeToTimeSpan(editFormData.endTime),
        appointmentType: editFormData.type,
        attendingPhysician: editFormData.doctor,
        notes: editFormData.notes,
        billableAmount: parseFloat(editFormData.billableAmount) || 0,
        paidAmount: parseFloat(editFormData.paidAmount) || 0,
        pendingAmount: parseFloat(editFormData.pendingAmount) || 0,
        status: editFormData.status,
        paymentStatus: editFormData.paymentStatus,
        reasonForVisit: editFormData.reasonForVisit || ''
      };
      
      console.log('📤 Sending payload to backend:', updatePayload);
      
      // Call API to update
      await updateAppointment(updatePayload);
      
      console.log('✅ Appointment updated successfully');
      
      // Update local state
      const updatedAppointments = appointments.map(apt => 
        apt.id === selectedAppointment.id 
          ? { ...apt, ...editFormData }
          : apt
      );
      setAppointments(updatedAppointments);
      
      // Update selected appointment
      const updatedAppointment = { ...selectedAppointment, ...editFormData };
      setSelectedAppointment(updatedAppointment);
      
      // Exit edit mode
      setIsEditingAppointment(false);
      
      // Show success notification
      alert('✅ Appointment updated successfully!');
    } catch (error) {
      console.error('❌ Error updating appointment:', error);
      alert('❌ Failed to update appointment. Please try again.');
    } finally {
      setUpdatingAppointment(false);
    }
  };

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
    return processedAppointments.filter(apt => apt.date === dateStr);
  };

  const handleDateClick = (day) => {
    if (!day.isCurrentMonth) return;
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day.day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setViewMode("day");
  };

  const handlePreviousDay = () => {
    if (!selectedDate) return;
    const currentDateObj = new Date(selectedDate);
    currentDateObj.setDate(currentDateObj.getDate() - 1);
    const previousDate = currentDateObj.toISOString().split('T')[0];
    setSelectedDate(previousDate);
  };

  const handleNextDay = () => {
    if (!selectedDate) return;
    const currentDateObj = new Date(selectedDate);
    currentDateObj.setDate(currentDateObj.getDate() + 1);
    const nextDate = currentDateObj.toISOString().split('T')[0];
    setSelectedDate(nextDate);
  };

  const handleSlotClick = (time, dateStr) => {
    setSelectedSlot(time);
    const params = new URLSearchParams({
      openAppointment: "true",
      date: dateStr,
      startTime: time
    });
    navigate(`/patients?${params.toString()}`);
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
  
  const confirmBooking = async (appointment) => {
    try {
      setIsBookingLoading(true);

      // Get patient ID from navigation or form
      const patientId = patientFromNav?.patientId || 0;
      const clinicId = localStorage.getItem('clinicId') ? parseInt(localStorage.getItem('clinicId')) : 0;
      
      // Convert time format from HH:mm to HH:mm:ss (TimeSpan format)
      const convertTimeToTimeSpan = (time) => {
        if (!time) return null;
        // If already in HH:mm:ss format, return as is
        if (time.split(':').length === 3) return time;
        // If in HH:mm format, add :00
        return `${time}:00`;
      };
      
      // Prepare appointment payload matching AppointmentsModel
      const appointmentPayload = {
        patientId: patientId,
        clinicId: clinicId,
        firstName: bookingForm.patientName.split(' ')[0] || '',
        lastName: bookingForm.patientName.split(' ').slice(1).join(' ') || '',
        phoneNumber: bookingForm.patientPhone,
        email: bookingForm.patientEmail,
        appointmentDate: bookingForm.date,
        startTime: convertTimeToTimeSpan(bookingForm.startTime),
        endTime: convertTimeToTimeSpan(bookingForm.endTime),
        durationMinutes: bookingForm.durationMinutes,
        appointmentType: bookingForm.type,
        reasonForVisit: bookingForm.reasonForVisit,
        status: bookingForm.appointmentStatus,
        notes: bookingForm.notes,
        billableAmount: bookingForm.billableAmount,
        paidAmount: bookingForm.paidAmount,
        pendingAmount: bookingForm.billableAmount - bookingForm.paidAmount,
        roomNumber: bookingForm.roomNumber || null,
        telehealthLink: bookingForm.telehealthLink || null,
        paymentStatus: bookingForm.paymentStatus,
        isConfirmed: bookingForm.isConfirmed,
        attendingPhysician: bookingForm.doctor || null
      };

      console.log('📤 Sending appointment to API:', appointmentPayload);
      console.log('⏰ Start Time Format:', appointmentPayload.startTime);
      console.log('⏰ End Time Format:', appointmentPayload.endTime);

      // Call API to create appointment
      await createAppointment(appointmentPayload);
      
      console.log('✅ Appointment created successfully');

      // Reload from backend so newly booked appointment appears immediately in calendar.
      await loadAppointments();

      // Show success modal with funny message
      const funnyMessages = [
        `Great! ${bookingForm.patientName}'s teeth are about to get some VIP treatment! 😁`,
        `Boom! 💥 ${bookingForm.patientName} just secured a spot on our calendar. Time to shine those pearly whites! ✨`,
        `${bookingForm.patientName} is now scheduled for ultimate dental excellence! Your smile is going to be 🔥`,
        `Success! ${bookingForm.patientName} will be flashing those teeth like a Hollywood star soon! 🌟`,
        `Ding ding ding! 🔔 ${bookingForm.patientName}'s appointment is locked and loaded!`,
        `Plot twist: ${bookingForm.patientName} just booked an appointment and their smile is ALREADY getting better! 😄`,
        `${bookingForm.patientName} is now officially our VIP patient for that slot! Let the magic happen! 🪄`,
        `Appointment saved! ${bookingForm.patientName}, get ready to have the best smile in town! 👑`
      ];

      const randomMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
      setSuccessMessage(randomMessage);
      setShowSuccessModal(true);

      // Reset modals
      setShowBookingModal(false);
      setShowDoubleBookingModal(false);
      setPendingAppointment(null);

      // Reset form after 3 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
        setBookingForm({
          patientName: "",
          patientPhone: "",
          patientEmail: "",
          date: "",
          startTime: "",
          endTime: "",
          durationMinutes: 30,
          type: "",
          doctor: "Dr. Smith",
          reasonForVisit: "",
          notes: "",
          billableAmount: 0,
          paidAmount: 0,
          pendingAmount: 0,
          roomNumber: "",
          telehealthLink: "",
          appointmentStatus: "Scheduled",
          paymentStatus: "Pending",
          isConfirmed: false
        });
      }, 3000);

    } catch (error) {
      console.error("❌ Error booking appointment:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      alert(`❌ Error booking appointment: ${errorMessage}`);
    } finally {
      setIsBookingLoading(false);
    }
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
      durationMinutes: 30,
      type: "",
      doctor: "Dr. Smith",
      reasonForVisit: "",
      notes: "",
      billableAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      roomNumber: "",
      telehealthLink: "",
      appointmentStatus: "Scheduled",
      paymentStatus: "Pending",
      isConfirmed: false
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
    return processedAppointments.some(apt => {
      if (apt.date !== dateStr) return false;
      const slotIdx = TIME_SLOTS.indexOf(time);
      const startIdx = TIME_SLOTS.indexOf(apt.startTime);
      const endIdx = TIME_SLOTS.indexOf(apt.endTime);
      return slotIdx >= startIdx && slotIdx < endIdx;
    });
  };

  const getAppointmentAtSlot = (dateStr, time) => {
    return processedAppointments.find(apt => {
      if (apt.date !== dateStr) return false;
      const slotIdx = TIME_SLOTS.indexOf(time);
      const startIdx = TIME_SLOTS.indexOf(apt.startTime);
      const endIdx = TIME_SLOTS.indexOf(apt.endTime);
      return slotIdx >= startIdx && slotIdx < endIdx;
    });
  };

  const getAppointmentsStartingAtSlot = (dateStr, time) => {
    return processedAppointments.filter((apt) => apt.date === dateStr && apt.startTime === time);
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

        {/* Calendar Controls - Only show in Month View */}
        {viewMode === "month" && (
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
                  {`${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
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
              </div>
            </div>
          </motion.div>
        )}

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
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePreviousDay}
                  className="p-2 rounded-lg bg-gradient-to-r from-coral-100 to-peach-100 text-coral-600 hover:from-coral-200 hover:to-peach-200 transition-all"
                  title="Previous day"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                
                <h3 className="text-2xl font-bold text-gray-800 min-w-[150px] text-center">
                  {selectedDate}
                </h3>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleNextDay}
                  className="p-2 rounded-lg bg-gradient-to-r from-coral-100 to-peach-100 text-coral-600 hover:from-coral-200 hover:to-peach-200 transition-all"
                  title="Next day"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setViewMode("month")}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-coral-500 to-peach-500 text-white font-semibold shadow-coral hover:shadow-lg transition-all"
                >
                  Back to Month
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const params = new URLSearchParams({
                      openAppointment: "true",
                      ...(selectedDate ? { date: selectedDate } : {})
                    });
                    navigate(`/patients?${params.toString()}`);
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-sage-500 text-white rounded-xl font-semibold shadow-teal hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span>➕</span>
                  <span>New Appointment</span>
                </motion.button>
              </div>
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-1 max-h-[600px] overflow-y-auto">
              {TIME_SLOTS.map((time) => {
                const appointment = getAppointmentAtSlot(selectedDate, time);
                const startingAppointments = getAppointmentsStartingAtSlot(selectedDate, time);
                const isBlocked = isSlotBlocked(selectedDate, time);
                const isStartOfAppointment = startingAppointments.length > 0;

                return (
                  <div key={time} className="relative">
                    {isStartOfAppointment ? (
                      <>
                        {startingAppointments.map((currentAppointment, index) => {
                          const totalAppointments = startingAppointments.length;
                          const cardWidth = 100 / totalAppointments;

                          return (
                            <motion.div
                              key={currentAppointment.id}
                              drag="y"
                              dragConstraints={{ top: 0, bottom: 0 }}
                              dragElastic={0.1}
                              onDragEnd={(e, info) => {
                                const dragDistance = info.offset.y;
                                const slotsMoved = Math.round(dragDistance / 60);
                                if (slotsMoved !== 0) {
                                  const currentIdx = TIME_SLOTS.indexOf(time);
                                  const newIdx = Math.max(0, Math.min(TIME_SLOTS.length - 1, currentIdx + slotsMoved));
                                  handleAppointmentDrag(currentAppointment.id, TIME_SLOTS[newIdx]);
                                }
                              }}
                              whileHover={{ scale: 1.02, zIndex: 50, y: -2 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointment(currentAppointment);
                                setEditFormData({
                                  patient: currentAppointment.patient || "",
                                  patientPhone: currentAppointment.patientPhone || "",
                                  patientEmail: currentAppointment.patientEmail || "",
                                  date: currentAppointment.date || "",
                                  startTime: currentAppointment.startTime || "",
                                  endTime: currentAppointment.endTime || "",
                                  type: currentAppointment.type || "",
                                  doctor: currentAppointment.doctor || "",
                                  notes: currentAppointment.notes || "",
                                  billableAmount: currentAppointment.billableAmount || 0,
                                  paidAmount: currentAppointment.paidAmount || 0,
                                  pendingAmount: currentAppointment.pendingAmount || 0,
                                  status: currentAppointment.status || "",
                                  paymentStatus: currentAppointment.paymentStatus || "",
                                  reasonForVisit: currentAppointment.reasonForVisit || ""
                                });
                                setIsEditingAppointment(false);
                                setShowAppointmentModal(true);
                              }}
                              className="absolute cursor-move"
                              style={{
                                height: '60px',
                                width: `calc(${cardWidth}% - ${totalAppointments > 1 ? 6 : 2}px)`,
                                left: `calc(${index * cardWidth}%)`,
                                top: '0px',
                                zIndex: 10 + index
                              }}
                            >
                              <div className={`h-full bg-gradient-to-br from-${currentAppointment.color}-400 to-${currentAppointment.color}-500 rounded-lg p-2.5 shadow-md hover:shadow-xl border border-${currentAppointment.color}-300 transition-all flex items-center justify-center`}>
                                <p className="font-bold text-white text-sm text-center truncate px-1">{currentAppointment.patient}</p>
                              </div>
                            </motion.div>
                          );
                        })}
                      </>
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

        {/* Booking Modal - BEAUTIFUL PROFESSIONAL DESIGN */}
        <AnimatePresence>
          {showBookingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBookingModal(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 30 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-slate-100"
              >
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-500 px-8 py-6 rounded-t-2xl flex items-center justify-between border-b border-teal-400/30">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                      <span className="text-3xl">📅</span> New Appointment
                    </h2>
                    <p className="text-teal-100 text-sm mt-0.5">Enter patient and appointment details</p>
                  </div>
                  <motion.button 
                    onClick={() => setShowBookingModal(false)} 
                    whileHover={{ rotate: 90, scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-lg transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Content */}
                <div className="px-8 py-6 overflow-y-auto flex-1 bg-gradient-to-b from-white to-slate-50">
                  <form onSubmit={handleBookingSubmit} className="space-y-6">
                    
                    {/* Section 1: Patient Information */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition">
                      <div className="bg-gradient-to-r from-teal-50 to-cyan-50 px-5 py-3 border-b border-slate-200">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="text-lg">👤</span> Patient Information
                        </h3>
                      </div>
                      <div className="p-5 grid grid-cols-4 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name *</label>
                          <input type="text" required value={bookingForm.patientName} onChange={(e) => setBookingForm({ ...bookingForm, patientName: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition" placeholder="John Doe" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Phone *</label>
                          <input type="tel" required value={bookingForm.patientPhone} onChange={(e) => setBookingForm({ ...bookingForm, patientPhone: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition" placeholder="(555) 000-0000" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                          <input type="email" value={bookingForm.patientEmail} onChange={(e) => setBookingForm({ ...bookingForm, patientEmail: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition" placeholder="john@example.com" />
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Appointment Schedule */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition">
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-5 py-3 border-b border-slate-200">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="text-lg">⏰</span> Schedule
                        </h3>
                      </div>
                      <div className="p-5 grid grid-cols-3 gap-4">
                        <div>
                          <FancyDatePicker label="Date" required value={bookingForm.date} onChange={(date) => setBookingForm({ ...bookingForm, date })} minDate={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Start Time *</label>
                          <select required value={bookingForm.startTime} onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white">
                            <option value="">Select time</option>
                            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">End Time *</label>
                          <select required value={bookingForm.endTime} onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white">
                            <option value="">Select time</option>
                            {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (min)</label>
                          <input type="number" min="15" step="15" value={bookingForm.durationMinutes} onChange={(e) => setBookingForm({ ...bookingForm, durationMinutes: parseInt(e.target.value) || 30 })} className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition" />
                        </div>
                      </div>
                    </div>

                    {/* Section 3: Treatment Details */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-5 py-3 border-b border-slate-200">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="text-lg">🦷</span> Treatment Details
                        </h3>
                      </div>
                      <div className="p-5 grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Treatment Type *</label>
                          <select required value={bookingForm.type} onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition bg-white">
                            <option value="">Select type</option>
                            {TREATMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor</label>
                          <input type="text" value={bookingForm.doctor} onChange={(e) => setBookingForm({ ...bookingForm, doctor: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition" placeholder="Dr. Smith" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">Reason for Visit</label>
                          <input type="text" value={bookingForm.reasonForVisit} onChange={(e) => setBookingForm({ ...bookingForm, reasonForVisit: e.target.value })} className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition" placeholder="Checkup, Pain, etc." />
                        </div>
                      </div>
                    </div>

                    {/* Section 5: Additional Notes */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition">
                      <div className="bg-gradient-to-r from-orange-50 to-red-50 px-5 py-3 border-b border-slate-200">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          <span className="text-lg">📝</span> Additional Notes
                        </h3>
                      </div>
                      <div className="p-5">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                        <textarea value={bookingForm.notes} onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })} rows={2} className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition resize-none" placeholder="Additional notes or special requests..." />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <motion.button 
                        type="button"
                        onClick={() => setShowBookingModal(false)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-3 bg-slate-200 text-slate-700 rounded-lg font-bold text-sm shadow-sm hover:shadow-md hover:bg-slate-300 transition"
                      >
                        ✕ Cancel
                      </motion.button>
                      <motion.button 
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 py-3 bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-lg font-bold text-sm shadow-lg hover:shadow-xl hover:from-teal-700 hover:to-cyan-600 transition flex items-center justify-center gap-2"
                      >
                        <span>✓</span> Book Appointment
                      </motion.button>
                    </div>
                  </form>
                </div>
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
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              >
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-cyan-600 p-5 flex items-center justify-between rounded-t-2xl">
                  <div>
                    <h3 className="text-xl font-bold text-white">📅 Appointment Details</h3>
                    <p className="text-xs text-cyan-100 mt-1">ID: {selectedAppointment.id}</p>
                  </div>
                  <div className="flex gap-3">
                    {!isEditingAppointment && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsEditingAppointment(true)}
                        className="px-4 py-2 bg-white text-teal-600 rounded-lg font-bold text-sm hover:bg-cyan-50 transition-colors"
                      >
                        ✏️ Edit
                      </motion.button>
                    )}
                    <button
                      onClick={() => setShowAppointmentModal(false)}
                      className="text-white hover:text-gray-200 transition-colors"
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Patient Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-blue-600 font-bold uppercase mb-2 block">👤 Patient Name</label>
                      {isEditingAppointment ? (
                        <input
                          type="text"
                          value={editFormData.patient}
                          onChange={(e) => setEditFormData({ ...editFormData, patient: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-base font-bold text-gray-800 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">{editFormData.patient}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-purple-600 font-bold uppercase mb-2 block">👨‍⚕️ Doctor</label>
                      {isEditingAppointment ? (
                        <input
                          type="text"
                          value={editFormData.doctor}
                          onChange={(e) => setEditFormData({ ...editFormData, doctor: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      ) : (
                        <p className="text-base font-bold text-gray-800 bg-purple-50 p-3 rounded-lg border-l-4 border-purple-500">{editFormData.doctor}</p>
                      )}
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-600 font-bold uppercase mb-2 block">📞 Phone</label>
                      {isEditingAppointment ? (
                        <input
                          type="tel"
                          value={editFormData.patientPhone}
                          onChange={(e) => setEditFormData({ ...editFormData, patientPhone: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg">{editFormData.patientPhone}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-600 font-bold uppercase mb-2 block">✉️ Email</label>
                      {isEditingAppointment ? (
                        <input
                          type="email"
                          value={editFormData.patientEmail}
                          onChange={(e) => setEditFormData({ ...editFormData, patientEmail: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        />
                      ) : (
                        <p className="text-sm font-semibold text-gray-800 bg-gray-50 p-3 rounded-lg truncate">{editFormData.patientEmail}</p>
                      )}
                    </div>
                  </div>

                  {/* Date & Time */}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-orange-600 font-bold uppercase mb-2 block">📅 Date</label>
                      {isEditingAppointment ? (
                        <input
                          type="date"
                          value={editFormData.date}
                          onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      ) : (
                        <p className="text-sm font-bold text-gray-800 bg-orange-50 p-3 rounded-lg border-l-4 border-orange-500">{editFormData.date}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-green-600 font-bold uppercase mb-2 block">🕐 Start Time</label>
                      {isEditingAppointment ? (
                        <input
                          type="time"
                          value={editFormData.startTime}
                          onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      ) : (
                        <p className="text-sm font-bold text-gray-800 bg-green-50 p-3 rounded-lg border-l-4 border-green-500">{editFormData.startTime}</p>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-red-600 font-bold uppercase mb-2 block">⏱️ End Time</label>
                      {isEditingAppointment ? (
                        <input
                          type="time"
                          value={editFormData.endTime}
                          onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      ) : (
                        <p className="text-sm font-bold text-gray-800 bg-red-50 p-3 rounded-lg border-l-4 border-red-500">{editFormData.endTime}</p>
                      )}
                    </div>
                  </div>

                  {/* Treatment Type */}
                  <div>
                    <label className="text-xs text-indigo-600 font-bold uppercase mb-2 block">🦷 Treatment Type</label>
                    {isEditingAppointment ? (
                      <select
                        value={editFormData.type}
                        onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-indigo-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="">Select Treatment Type</option>
                        {TREATMENT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm font-bold text-gray-800 bg-indigo-50 p-3 rounded-lg border-l-4 border-indigo-500">{editFormData.type}</p>
                    )}
                  </div>

                  {/* Reason for Visit */}
                  <div>
                    <label className="text-xs text-cyan-600 font-bold uppercase mb-2 block">💬 Reason for Visit</label>
                    {isEditingAppointment ? (
                      <textarea
                        value={editFormData.reasonForVisit}
                        onChange={(e) => setEditFormData({ ...editFormData, reasonForVisit: e.target.value })}
                        placeholder="Enter reason for visit..."
                        className="w-full p-3 border-2 border-cyan-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 min-h-[80px] resize-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 bg-cyan-50 p-3 rounded-lg border-l-4 border-cyan-500">{editFormData.reasonForVisit || "No reason specified"}</p>
                    )}
                  </div>

                  {/* Financial Details */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-700 uppercase">💰 Financial Details</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-emerald-600 font-bold mb-2 block">Total Amount</label>
                        {isEditingAppointment ? (
                          <input
                            type="number"
                            value={editFormData.billableAmount}
                            onChange={(e) => setEditFormData({ ...editFormData, billableAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            step="0.01"
                          />
                        ) : (
                          <p className="text-lg font-bold text-emerald-700 bg-emerald-50 p-3 rounded-lg border-l-4 border-emerald-500">₹{editFormData.billableAmount.toFixed(2)}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-green-600 font-bold mb-2 block">Paid Amount</label>
                        {isEditingAppointment ? (
                          <input
                            type="number"
                            value={editFormData.paidAmount}
                            onChange={(e) => setEditFormData({ ...editFormData, paidAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            step="0.01"
                          />
                        ) : (
                          <p className="text-lg font-bold text-green-700 bg-green-50 p-3 rounded-lg border-l-4 border-green-500">₹{editFormData.paidAmount.toFixed(2)}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-orange-600 font-bold mb-2 block">Pending Amount</label>
                        {isEditingAppointment ? (
                          <input
                            type="number"
                            value={editFormData.pendingAmount}
                            onChange={(e) => setEditFormData({ ...editFormData, pendingAmount: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border-2 border-orange-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                            step="0.01"
                          />
                        ) : (
                          <p className="text-lg font-bold text-orange-700 bg-orange-50 p-3 rounded-lg border-l-4 border-orange-500">₹{editFormData.pendingAmount.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-700 uppercase">💳 Payment Status</p>
                    {isEditingAppointment ? (
                      <div className="space-y-3">
                        <select
                          value={editFormData.paymentStatus}
                          onChange={(e) => setEditFormData({ ...editFormData, paymentStatus: e.target.value })}
                          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                        >
                          <option value="">Select Payment Status</option>
                          <option value="Pending">⏳ Pending</option>
                          <option value="Paid">✅ Paid</option>
                          <option value="Partial">💸 Partial</option>
                          <option value="Invoice">📄 Invoice</option>
                        </select>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setPaymentModalAppointment(selectedAppointment);
                            setShowPaymentDetailsModal(true);
                          }}
                          className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg text-sm font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                        >
                          💰 Update Payment Details
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {['Pending', 'Paid', 'Partial', 'Invoice'].map((status) => {
                          const statusColors = {
                            'Pending': 'bg-yellow-500 text-white',
                            'Paid': 'bg-green-500 text-white',
                            'Partial': 'bg-blue-500 text-white',
                            'Invoice': 'bg-purple-500 text-white'
                          };
                          const statusEmojis = {
                            'Pending': '⏳',
                            'Paid': '✅',
                            'Partial': '💸',
                            'Invoice': '📄'
                          };
                          return (
                            <span
                              key={status}
                              className={`px-3 py-2 rounded-lg text-xs font-bold ${
                                editFormData.paymentStatus === status
                                  ? statusColors[status]
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {statusEmojis[status]} {status}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Appointment Status */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-700 uppercase">📊 Appointment Status</p>
                    {isEditingAppointment ? (
                      <select
                        value={editFormData.status}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500"
                      >
                        <option value="">Select Status</option>
                        <option value="Confirmed">✅ Confirmed</option>
                        <option value="Pending">⏳ Pending</option>
                        <option value="Completed">🎉 Completed</option>
                        <option value="Cancelled">❌ Cancelled</option>
                      </select>
                    ) : (
                      <div className="flex gap-2 flex-wrap">
                        {['Confirmed', 'Pending', 'Completed', 'Cancelled'].map((status) => {
                          const statusColors = {
                            'Confirmed': 'bg-green-500 text-white',
                            'Pending': 'bg-yellow-500 text-white',
                            'Completed': 'bg-blue-500 text-white',
                            'Cancelled': 'bg-red-500 text-white'
                          };
                          const statusEmojis = {
                            'Confirmed': '✅',
                            'Pending': '⏳',
                            'Completed': '🎉',
                            'Cancelled': '❌'
                          };
                          return (
                            <span
                              key={status}
                              className={`px-3 py-2 rounded-lg text-xs font-bold ${
                                editFormData.status === status
                                  ? statusColors[status]
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {statusEmojis[status]} {status}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs text-yellow-600 font-bold uppercase mb-2 block">📝 Notes</label>
                    {isEditingAppointment ? (
                      <textarea
                        value={editFormData.notes}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        placeholder="Enter appointment notes..."
                        className="w-full p-3 border-2 border-yellow-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 min-h-[100px] resize-none"
                      />
                    ) : (
                      <p className="text-sm text-gray-700 bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-500">{editFormData.notes || "No notes"}</p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="border-t bg-gray-50 p-4 flex gap-3 rounded-b-2xl">
                  {isEditingAppointment ? (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleUpdateAppointment}
                        disabled={updatingAppointment}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {updatingAppointment ? '⏳ Updating...' : '✅ Update'}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setIsEditingAppointment(false);
                          setEditFormData({
                            patient: selectedAppointment.patient || "",
                            patientPhone: selectedAppointment.patientPhone || "",
                            patientEmail: selectedAppointment.patientEmail || "",
                            date: selectedAppointment.date || "",
                            startTime: selectedAppointment.startTime || "",
                            endTime: selectedAppointment.endTime || "",
                            type: selectedAppointment.type || "",
                            doctor: selectedAppointment.doctor || "",
                            notes: selectedAppointment.notes || "",
                            billableAmount: selectedAppointment.billableAmount || 0,
                            paidAmount: selectedAppointment.paidAmount || 0,
                            pendingAmount: selectedAppointment.pendingAmount || 0,
                            status: selectedAppointment.status || "",
                            paymentStatus: selectedAppointment.paymentStatus || "",
                            reasonForVisit: selectedAppointment.reasonForVisit || ""
                          });
                        }}
                        disabled={updatingAppointment}
                        className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                      >
                        ✕ Cancel
                      </motion.button>
                    </>
                  ) : (
                    <>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setAppointmentToDelete(selectedAppointment);
                          setShowDeleteConfirmModal(true);
                        }}
                        className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                      >
                        🗑️ Delete Appointment
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowAppointmentModal(false)}
                        className="flex-1 py-3 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                      >
                        ✕ Close
                      </motion.button>
                    </>
                  )}
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
                    disabled={isBookingLoading}
                    className="flex-1 py-3 bg-gradient-to-r from-coral-500 to-peach-500 text-white rounded-xl font-semibold shadow-coral hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isBookingLoading ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Booking...
                      </>
                    ) : (
                      "Yes, Double Book"
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirmModal && appointmentToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[120] flex items-center justify-center p-4"
              onClick={() => setShowDeleteConfirmModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gradient-to-r from-red-500 to-rose-500 p-6 text-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                      ⚠️
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Delete Appointment</h3>
                      <p className="text-red-100 text-sm">This action cannot be undone</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to delete this appointment?
                  </p>
                  
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2 mb-6">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-semibold">Patient:</span>
                      <span className="text-gray-900">{appointmentToDelete.patient}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-semibold">Date:</span>
                      <span className="text-gray-900">{appointmentToDelete.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600 font-semibold">Time:</span>
                      <span className="text-gray-900">{appointmentToDelete.startTime} - {appointmentToDelete.endTime}</span>
                    </div>
                    {appointmentToDelete.type && (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600 font-semibold">Type:</span>
                        <span className="text-gray-900">{appointmentToDelete.type}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowDeleteConfirmModal(false)}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setAppointments(appointments.filter(apt => apt.id !== appointmentToDelete.id));
                        setShowDeleteConfirmModal(false);
                        setShowAppointmentModal(false);
                        setSuccessMessage('🗑️ Appointment deleted successfully!');
                        setShowSuccessModal(true);
                        setTimeout(() => setShowSuccessModal(false), 2000);
                      }}
                      className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      Delete
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Modal */}
        <AnimatePresence>
          {showSuccessModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0, y: 50 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-3xl shadow-2xl max-w-md w-full p-8 border-2 border-teal-200 text-center"
              >
                {/* Animated Success Icon */}
                <motion.div
                  animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="text-6xl mb-4"
                >
                  🎉
                </motion.div>

                <h2 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent mb-4">
                  Appointment Booked!
                </h2>

                <p className="text-gray-700 text-base leading-relaxed mb-6 font-medium">
                  {successMessage}
                </p>

                {/* Confetti Animation */}
                <div className="mb-6 h-12 flex items-center justify-center">
                  <motion.div
                    animate={{ y: -20, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute text-2xl"
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    animate={{ y: -20, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                    className="absolute text-2xl"
                  >
                    🎊
                  </motion.div>
                  <motion.div
                    animate={{ y: -20, opacity: 0 }}
                    transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                    className="absolute text-2xl"
                  >
                    🌟
                  </motion.div>
                </div>

                <div className="bg-white rounded-xl p-4 mb-6 border border-teal-100">
                  <p className="text-sm text-gray-600 mb-2">Redirecting to calendar in...</p>
                  <motion.div
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 3, ease: "linear" }}
                    className="h-1 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowSuccessModal(false);
                    navigate("/calendar");
                  }}
                  className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  ✓ Go to Calendar Now
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Details Modal */}
        <PaymentDetailsModal 
          isOpen={showPaymentDetailsModal}
          onClose={() => setShowPaymentDetailsModal(false)}
          appointmentData={paymentModalAppointment}
        />
      </div>
    </div>
  );
}


