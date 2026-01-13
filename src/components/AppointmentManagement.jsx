import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function AppointmentListModal({
  show,
  onClose,
  appointments,
  loading,
  error,
  filterQuery,
  setFilterQuery,
  onEdit,
  onDelete,
  filteredAppointments,
  enterpriseId,
  clinicId,
  firstName,
  lastName,
  doctorId,
  setEnterpriseIdFilter,
  setClinicIdFilter,
  setFirstNameFilter,
  setLastNameFilter,
  setDoctorIdFilter,
  setAppointmentDateFilter,
  enterprises = [],
  clinics = [],
  doctors = [],
  onEnterpriseChange,
  onClinicChange,
  onApplyFilters
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [filterEnterpriseId, setFilterEnterpriseId] = useState(enterpriseId || "");
  const [filterClinicId, setFilterClinicId] = useState(clinicId || "");
  const [filterFirstName, setFilterFirstName] = useState(firstName || "");
  const [filterLastName, setFilterLastName] = useState(lastName || "");
  const [filterDoctorId, setFilterDoctorId] = useState(doctorId || "");
  const [filterAppointmentDate, setFilterAppointmentDate] = useState("");
  const [filteredClinics, setFilteredClinics] = useState(clinics);
  const [filteredDoctors, setFilteredDoctors] = useState(doctors);

  // Keep clinics in sync when props update or enterprise selection changes
  useEffect(() => {
    const updated = filterEnterpriseId
      ? clinics.filter((c) => (c.enterpriseId || c.EnterpriseId || c.enterprise_id || "").toString() === filterEnterpriseId.toString())
      : clinics;
    setFilteredClinics(updated);
  }, [clinics, filterEnterpriseId]);

  // Keep doctors in sync when props update or clinic selection changes
  useEffect(() => {
    // doctors are already fetched per clinic; just mirror the latest list
    setFilteredDoctors(doctors || []);
  }, [doctors, filterClinicId]);

  if (!show) return null;

  // Apply filters and fetch appointments
  const handleApplyFilters = () => {
    if (!filterClinicId) {
      alert("❌ Please select a clinic first");
      return;
    }
    
    if (!filterAppointmentDate) {
      alert("❌ Please select an appointment date first");
      return;
    }
    
    if (onApplyFilters) {
      onApplyFilters({
        clinicId: filterClinicId || null,
        firstName: filterFirstName || null,
        lastName: filterLastName || null,
        doctorId: filterDoctorId || null,
        appointmentDate: filterAppointmentDate || null
      });
    }
  };

  // Get clinics filtered by selected enterprise
  const getClinicsByEnterprise = (entId) => {
    if (!entId) return clinics;
    return clinics.filter(clinic => clinic.enterpriseId == entId);
  };

  // Get doctors filtered by selected clinic (from clinics enterpriseId match)
  const getDoctorsByClinic = (clinicId) => {
    if (!clinicId) return doctors;
    // Since we can't directly filter by clinicId from the all doctors list,
    // we rely on the onClinicChange callback to fetch doctors
    return doctors;
  };

  // Handle enterprise change
  const handleEnterpriseChange = (entId) => {
    setFilterEnterpriseId(entId);
    setFilterClinicId(""); // Reset clinic when enterprise changes
    setFilterDoctorId(""); // Reset doctor when enterprise changes
    setFilteredClinics(getClinicsByEnterprise(entId));
    setFilteredDoctors([]); // Clear doctors until clinic is selected
    
    // Call parent function if provided
    if (onEnterpriseChange) {
      onEnterpriseChange(entId);
    }
  };

  // Handle clinic change
  const handleClinicChange = (clinicId) => {
    setFilterClinicId(clinicId);
    setFilterDoctorId(""); // Reset doctor when clinic changes
    
    // Call parent function if provided
    if (onClinicChange) {
      onClinicChange(clinicId);
    }
  };

  // Simply display the appointments from parent (already filtered by API)
  const getFilteredByParams = () => {
    // The appointments come from the API already filtered by clinicId and appointmentDate
    // Apply search filter if user entered text
    if (!filterQuery.trim()) {
      return appointments || [];
    }
    
    const query = filterQuery.trim().toLowerCase();
    return (appointments || []).filter(apt => {
      const fields = [
        apt.firstName,
        apt.lastName,
        apt.email,
        apt.phoneNumber,
        apt.appointmentType,
        apt.status,
        apt.reasonForVisit
      ].map(f => (f || "").toString().toLowerCase());
      return fields.some(f => f.includes(query));
    });
  };

  const appointmentsToDisplay = getFilteredByParams();

  const handleClearFilters = () => {
    setFilterEnterpriseId("");
    setFilterClinicId("");
    setFilterFirstName("");
    setFilterLastName("");
    setFilterDoctorId("");
    setFilterAppointmentDate("");
    setFilterQuery("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative max-w-6xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">📅 Appointments</h2>
            <p className="text-pink-100">Total: {appointmentsToDisplay.length}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-pink-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3">
              {error}
            </div>
          )}

          {/* Filter Section */}
          <div className="sticky top-0 bg-white z-10 border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">🔍 Filter Appointments</h3>
              <button
                onClick={handleClearFilters}
                className="text-sm px-3 py-1 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
              >
                Clear Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Enterprise ID */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">🏢 Enterprise ID *</label>
                <select
                  value={filterEnterpriseId}
                  onChange={(e) => handleEnterpriseChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                >
                  <option value="">Select Enterprise</option>
                  {enterprises.map((enterprise) => (
                    <option key={enterprise.enterpriseId} value={enterprise.enterpriseId}>
                      {enterprise.enterpriseName || enterprise.name || `Enterprise ${enterprise.enterpriseId}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Clinic ID */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">🏥 Clinic ID *</label>
                <select
                  value={filterClinicId}
                  onChange={(e) => handleClinicChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                  disabled={!filterEnterpriseId}
                >
                  <option value="">{filterEnterpriseId ? "Select Clinic" : "Select Enterprise First"}</option>
                  {filteredClinics.map((clinic) => (
                    <option key={clinic.clinicId} value={clinic.clinicId}>
                      {clinic.clinicName || clinic.name || `Clinic ${clinic.clinicId}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* First Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">👤 First Name</label>
                <input
                  type="text"
                  placeholder="Patient's first name"
                  value={filterFirstName}
                  onChange={(e) => setFilterFirstName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">👤 Last Name</label>
                <input
                  type="text"
                  placeholder="Patient's last name"
                  value={filterLastName}
                  onChange={(e) => setFilterLastName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                />
              </div>

              {/* Doctor ID */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">👨‍⚕️ Doctor ID</label>
                <select
                  value={filterDoctorId}
                  onChange={(e) => setFilterDoctorId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                  disabled={!filterClinicId}
                >
                  <option value="">{filterClinicId ? "Select Doctor" : "Select Clinic First"}</option>
                  {filteredDoctors.map((doctor) => (
                    <option key={doctor.doctorId} value={doctor.doctorId}>
                      {doctor.name || `Dr. ${doctor.firstName || ""} ${doctor.lastName || ""}`.trim() || `Doctor ${doctor.doctorId}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Appointment Date */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">📅 Appointment Date</label>
                <input
                  type="date"
                  placeholder="dd-mm-yyyy"
                  value={filterAppointmentDate}
                  onChange={(e) => setFilterAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                />
              </div>
            </div>

            {/* Buttons Row */}
            <div className="flex gap-3">
              <button
                onClick={handleApplyFilters}
                className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-semibold transition-colors"
              >
                🔍 Apply Filters
              </button>
              <button
                onClick={() => {
                  setFilterEnterpriseId("");
                  setFilterClinicId("");
                  setFilterFirstName("");
                  setFilterLastName("");
                  setFilterDoctorId("");
                  setFilterAppointmentDate("");
                  setFilterQuery("");
                }}
                className="flex-1 px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
              >
                ⟲ Clear Filters
              </button>
            </div>

            {/* Search */}
            <div>
              <input
                type="text"
                placeholder="Search by name, email, phone, type, status..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading appointments...</div>
          ) : appointmentsToDisplay.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <div className="text-xl font-bold text-slate-700 mb-2">No appointments found</div>
              <div className="text-slate-500 mb-4">
                We couldn't find any appointments matching your search criteria.
              </div>
              <div className="text-sm text-slate-600 bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                <div className="font-semibold mb-2">💡 Tips:</div>
                <ul className="text-left space-y-1">
                  <li>• Check if the clinic and date are correct</li>
                  <li>• Try selecting a different date</li>
                  <li>• Remove optional filters (name, doctor)</li>
                  <li>• Verify the clinic has appointments on this date</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {appointmentsToDisplay.map((apt) => (
                <motion.div
                  key={apt.appointmentId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-slate-300 rounded-xl p-4 hover:shadow-lg transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-slate-800">
                          {apt.firstName} {apt.lastName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          apt.status === "Scheduled" ? "bg-blue-100 text-blue-700" :
                          apt.status === "Completed" ? "bg-green-100 text-green-700" :
                          apt.status === "Cancelled" ? "bg-red-100 text-red-700" :
                          apt.status === "No-show" ? "bg-yellow-100 text-yellow-700" :
                          "bg-slate-100 text-slate-700"
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-slate-600 text-xs font-semibold">📅 Date & Time</span>
                          <p className="font-medium text-slate-800">
                            {new Date(apt.appointmentDate).toLocaleDateString()} 
                            {apt.startTime && ` • ${apt.startTime}`}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-600 text-xs font-semibold">📞 Phone</span>
                          <p className="font-medium text-slate-800">{apt.phoneNumber}</p>
                        </div>
                        <div>
                          <span className="text-slate-600 text-xs font-semibold">✉️ Email</span>
                          <p className="font-medium text-slate-800 truncate">{apt.email || "N/A"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
                        <div>
                          <span className="text-slate-600 text-xs font-semibold">🏥 Clinic ID</span>
                          <p className="font-medium text-slate-800">{apt.clinicId}</p>
                        </div>
                        <div>
                          <span className="text-slate-600 text-xs font-semibold">👨‍⚕️ Doctor ID</span>
                          <p className="font-medium text-slate-800">{apt.doctorId || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-slate-600 text-xs font-semibold">🏷️ Type</span>
                          <p className="font-medium text-slate-800">{apt.appointmentType}</p>
                        </div>
                        <div>
                          <span className="text-slate-600 text-xs font-semibold">⏱️ Duration</span>
                          <p className="font-medium text-slate-800">{apt.durationMinutes || "N/A"} min</p>
                        </div>
                      </div>

                      {apt.reasonForVisit && (
                        <div className="mb-3">
                          <span className="text-slate-600 text-xs font-semibold">📋 Reason for Visit</span>
                          <p className="font-medium text-slate-800">{apt.reasonForVisit}</p>
                        </div>
                      )}

                      {apt.billableAmount && (
                        <div className="grid grid-cols-3 gap-4 mb-3 text-sm bg-amber-50 p-3 rounded-lg">
                          <div>
                            <span className="text-slate-600 text-xs font-semibold">💰 Billable</span>
                            <p className="font-bold text-slate-800">₹{apt.billableAmount}</p>
                          </div>
                          <div>
                            <span className="text-slate-600 text-xs font-semibold">✅ Paid</span>
                            <p className="font-bold text-green-700">₹{apt.paidAmount || 0}</p>
                          </div>
                          <div>
                            <span className="text-slate-600 text-xs font-semibold">⏳ Pending</span>
                            <p className="font-bold text-red-700">₹{apt.pendingAmount || apt.billableAmount}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => onEdit(apt)}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors text-sm whitespace-nowrap"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => onDelete(apt)}
                        className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors text-sm whitespace-nowrap"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {apt.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-200">
                      <span className="text-slate-600 text-xs font-semibold">📝 Notes</span>
                      <p className="text-slate-700 text-sm">{apt.notes}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CreateAppointmentModal({
  show,
  onClose,
  form,
  setForm,
  onSubmit,
  loading,
  error,
  activeTab,
  setActiveTab,
  enterprises,
  clinics,
  doctors = [],
  onClinicChange,
  onEnterpriseChange
}) {
  if (!show) return null;

  const tabs = [
    { key: "basic", label: "Basic Info", icon: "📋" },
    { key: "scheduling", label: "Scheduling", icon: "🕐" },
    { key: "details", label: "Details", icon: "📝" },
    { key: "billing", label: "Billing", icon: "💳" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 p-6 text-white flex items-center justify-between">
          <h2 className="text-2xl font-bold">📅 Create Appointment</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-pink-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-rose-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form className="space-y-4">
            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Enterprise *</label>
                    <select
                      value={form.enterpriseId}
                      onChange={(e) => {
                        const selectedEnterpriseId = e.target.value;
                        setForm({ ...form, enterpriseId: selectedEnterpriseId, clinicId: "", doctorId: "", appointmentClinics: [] });
                        if (onEnterpriseChange) {
                          onEnterpriseChange(selectedEnterpriseId);
                        }
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      required
                    >
                      <option value="">Select Enterprise</option>
                      {enterprises && enterprises.length > 0 ? (
                        enterprises.map((e) => (
                          <option key={e.enterpriseId} value={e.enterpriseId}>
                            {e.enterpriseName || e.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No enterprises available</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic *</label>
                    <select
                      value={form.clinicId}
                      onChange={(e) => {
                        const selectedClinicId = e.target.value;
                        setForm({ ...form, clinicId: selectedClinicId, doctorId: "" });
                        if (onClinicChange) {
                          onClinicChange(selectedClinicId);
                        }
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      required
                      disabled={!form.enterpriseId}
                    >
                      <option value="">{form.enterpriseId ? "Select Clinic" : "Please select Enterprise first"}</option>
                      {form.appointmentClinics && form.appointmentClinics.map((c) => (
                        <option key={c.clinicId} value={c.clinicId}>
                          {c.clinicName || c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="Patient first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="Patient last name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Phone *</label>
                    <input
                      type="tel"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="Patient phone"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="Patient email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Patient ID *</label>
                  <input
                    type="number"
                    value={form.patientId}
                    onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    placeholder="Patient ID"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor</label>
                    <select
                      value={form.doctorId || ""}
                      onChange={(e) => {
                        const selectedDoctorId = e.target.value;
                        const selectedDoctor = doctors?.find(doc => String(doc.doctorId) === selectedDoctorId);
                        const doctorName = selectedDoctor ? (selectedDoctor.name || `${selectedDoctor.firstName || ""} ${selectedDoctor.lastName || ""}`.trim()) : "";
                        setForm({ ...form, doctorId: selectedDoctorId, attendingPhysician: doctorName });
                      }}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      disabled={!form.clinicId}
                    >
                      <option value="">{form.clinicId ? "Select Doctor" : "Please select Clinic first"}</option>
                      {doctors && doctors.length > 0 ? (
                        doctors.map((doc) => (
                          <option key={doc.doctorId} value={String(doc.doctorId)}>
                            {doc.name || `${doc.firstName || ""} ${doc.lastName || ""}`}
                          </option>
                        ))
                      ) : (
                        form.clinicId && <option disabled>No doctors available</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Attending Physician</label>
                    <input
                      type="text"
                      value={form.attendingPhysician}
                      onChange={(e) => setForm({ ...form, attendingPhysician: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="Physician name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Reason for Visit</label>
                  <textarea
                    value={form.reasonForVisit}
                    onChange={(e) => setForm({ ...form, reasonForVisit: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    placeholder="Reason for this appointment"
                    rows="3"
                  />
                </div>
              </div>
            )}

            {/* Scheduling Tab */}
            {activeTab === "scheduling" && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Appointment Date *</label>
                  <input
                    type="date"
                    value={form.appointmentDate}
                    onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Start Time</label>
                    <input
                      type="time"
                      value={form.startTime}
                      onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">End Time</label>
                    <input
                      type="time"
                      value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (minutes)</label>
                    <input
                      type="number"
                      value={form.durationMinutes}
                      onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Room Number</label>
                    <input
                      type="text"
                      value={form.roomNumber}
                      onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="e.g., Room 101"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Details Tab */}
            {activeTab === "details" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Appointment Type</label>
                    <select
                      value={form.appointmentType}
                      onChange={(e) => setForm({ ...form, appointmentType: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    >
                      <option>Consultation</option>
                      <option>Follow-up</option>
                      <option>Telehealth</option>
                      <option>Checkup</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    >
                      <option value="Scheduled">Scheduled</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="NoShow">No Show</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    placeholder="Additional notes"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Telehealth Link</label>
                  <input
                    type="url"
                    value={form.telehealthLink}
                    onChange={(e) => setForm({ ...form, telehealthLink: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    placeholder="Zoom/Teams/Meet link"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={form.isConfirmed}
                      onChange={(e) => setForm({ ...form, isConfirmed: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-slate-700">Confirmed</span>
                  </label>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === "billing" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Billable Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.billableAmount}
                      onChange={(e) => setForm({ ...form, billableAmount: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="Total billable amount"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Status</label>
                    <select
                      value={form.paymentStatus}
                      onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Paid">Paid</option>
                      <option value="Invoice">Invoice</option>
                      <option value="Partial">Partial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Paid Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.paidAmount}
                      onChange={(e) => setForm({ ...form, paidAmount: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="Amount already paid"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Pending Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.pendingAmount}
                      onChange={(e) => setForm({ ...form, pendingAmount: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-rose-400 focus:border-transparent"
                      placeholder="Amount still pending"
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Appointment"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function EditAppointmentModal({
  show,
  onClose,
  form,
  onFormChange,
  onSubmit,
  loading,
  error,
  activeTab,
  setActiveTab,
  clinicDoctors = []
}) {
  if (!show) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">✏️ Edit Appointment</h2>
          <button onClick={onClose} className="text-xl hover:scale-110 transition">✕</button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 m-4">
            {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {["basic", "scheduling", "details", "billing"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-3 font-semibold transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-600 bg-blue-50"
                  : "text-slate-600 hover:text-slate-800"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {activeTab === "basic" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Patient ID</label>
                <input
                  type="number"
                  value={form.patientId || ""}
                  onChange={(e) => onFormChange("patientId", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic ID</label>
                <input
                  type="number"
                  value={form.clinicId || ""}
                  onChange={(e) => onFormChange("clinicId", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">First Name *</label>
                <input
                  type="text"
                  value={form.firstName || ""}
                  onChange={(e) => onFormChange("firstName", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                  placeholder="First name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name *</label>
                <input
                  type="text"
                  value={form.lastName || ""}
                  onChange={(e) => onFormChange("lastName", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                  placeholder="Last name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  value={form.phoneNumber || ""}
                  onChange={(e) => onFormChange("phoneNumber", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  value={form.email || ""}
                  onChange={(e) => onFormChange("email", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason for Visit</label>
                <textarea
                  value={form.reasonForVisit || ""}
                  onChange={(e) => onFormChange("reasonForVisit", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                  rows="3"
                />
              </div>
            </div>
          )}

          {activeTab === "scheduling" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Appointment Date *</label>
                <input
                  type="date"
                  value={form.appointmentDate ? form.appointmentDate.split('T')[0] : ""}
                  onChange={(e) => onFormChange("appointmentDate", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Doctor</label>
                <select
                  value={String(form.doctorId || "")}
                  onChange={(e) => {
                    const selectedDoctorId = e.target.value;
                    console.log("👨‍⚕️ Selected doctor ID:", selectedDoctorId);
                    
                    // Find the selected doctor to get their name
                    const selectedDoctor = clinicDoctors?.find(doc => String(doc.doctorId) === selectedDoctorId);
                    const doctorName = selectedDoctor ? (selectedDoctor.name || `${selectedDoctor.firstName || ""} ${selectedDoctor.lastName || ""}`.trim()) : "";
                    
                    console.log("👨‍⚕️ Selected doctor name:", doctorName);
                    
                    // Update both doctorId and attendingPhysician
                    onFormChange("doctorId", selectedDoctorId);
                    if (doctorName) {
                      onFormChange("attendingPhysician", doctorName);
                    }
                  }}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Doctor</option>
                  {clinicDoctors && clinicDoctors.length > 0 ? (
                    clinicDoctors.map((doc) => (
                      <option key={doc.doctorId} value={String(doc.doctorId)}>
                        {doc.name || `${doc.firstName || ""} ${doc.lastName || ""}`}{" "}
                        {String(form.doctorId) === String(doc.doctorId) ? "(Current)" : ""}
                      </option>
                    ))
                  ) : (
                    <option value={String(form.doctorId || "")} disabled>
                      {form.doctorId ? `Dr. ID: ${form.doctorId}` : "No doctors available"}
                    </option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Start Time</label>
                <input
                  type="time"
                  value={form.startTime || ""}
                  onChange={(e) => onFormChange("startTime", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">End Time</label>
                <input
                  type="time"
                  value={form.endTime || ""}
                  onChange={(e) => onFormChange("endTime", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  value={form.durationMinutes || ""}
                  onChange={(e) => onFormChange("durationMinutes", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Appointment Type</label>
                <select
                  value={form.appointmentType || ""}
                  onChange={(e) => onFormChange("appointmentType", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Select Type</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Checkup">Checkup</option>
                  <option value="Treatment">Treatment</option>
                  <option value="Follow-up">Follow-up</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status</label>
                <select
                  value={form.status || ""}
                  onChange={(e) => onFormChange("status", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="No-show">No-show</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <input
                    type="checkbox"
                    checked={form.isConfirmed || false}
                    onChange={(e) => onFormChange("isConfirmed", e.target.checked)}
                    className="mr-2"
                  />
                  Is Confirmed
                </label>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Notes</label>
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => onFormChange("notes", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Room Number</label>
                <input
                  type="text"
                  value={form.roomNumber || ""}
                  onChange={(e) => onFormChange("roomNumber", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Telehealth Link</label>
                <input
                  type="text"
                  value={form.telehealthLink || ""}
                  onChange={(e) => onFormChange("telehealthLink", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Billable Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.billableAmount || ""}
                  onChange={(e) => onFormChange("billableAmount", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Paid Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.paidAmount || ""}
                  onChange={(e) => onFormChange("paidAmount", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Pending Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.pendingAmount || ""}
                  onChange={(e) => onFormChange("pendingAmount", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Status</label>
                <select
                  value={form.paymentStatus || ""}
                  onChange={(e) => onFormChange("paymentStatus", e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-4 flex gap-3 border-t border-slate-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Appointment"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DeleteAppointmentModal({
  show,
  onClose,
  appointment,
  onConfirm,
  loading
}) {
  if (!show || !appointment) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
          <span className="text-2xl">⚠️</span>
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Delete Appointment?</h2>
          <p className="text-slate-600">
            Are you sure you want to delete the appointment for <strong>{appointment.firstName} {appointment.lastName}</strong> on <strong>{new Date(appointment.appointmentDate).toLocaleDateString()}</strong>?
          </p>
          <p className="text-sm text-slate-500">This action cannot be undone.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CreatePatientModal({
  show,
  onClose,
  form,
  setForm,
  onSubmit,
  loading,
  error,
  activeTab,
  setActiveTab,
  enterprises,
  clinics
}) {
  if (!show) return null;

  const tabs = [
    { key: "patient-info", label: "Patient Info", icon: "👤" },
    { key: "contact", label: "Contact", icon: "📞" },
    { key: "medical-info", label: "Medical Info", icon: "🏥" },
    { key: "insurance", label: "Insurance", icon: "💳" }
  ];

  const handleNextTab = () => {
    const tabKeys = tabs.map(t => t.key);
    const currentIndex = tabKeys.indexOf(activeTab);
    if (currentIndex < tabKeys.length - 1) {
      setActiveTab(tabKeys[currentIndex + 1]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative max-w-2xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6 text-white flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">📝 Register New Patient</h2>
            <p className="text-teal-100 text-sm mt-1">Fill in the patient information to create a new record</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-teal-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                activeTab === tab.key
                  ? "bg-teal-500 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="rounded-xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form className="space-y-4">
            {/* Patient Info Tab */}
            {activeTab === "patient-info" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Enterprise *</label>
                    <select
                      value={form.enterpriseId}
                      onChange={(e) => setForm({ ...form, enterpriseId: e.target.value, clinicId: "" })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      required
                    >
                      <option value="">Select Enterprise</option>
                      {enterprises && enterprises.length > 0 ? (
                        enterprises.map((e) => (
                          <option key={e.enterpriseId} value={e.enterpriseId}>
                            {e.enterpriseName || e.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>No enterprises available</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Clinic *</label>
                    <select
                      value={form.clinicId}
                      onChange={(e) => setForm({ ...form, clinicId: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      required
                      disabled={!form.enterpriseId}
                    >
                      <option value="">{form.enterpriseId ? "Select Clinic" : "Please select Enterprise first"}</option>
                      {form.patientClinics && form.patientClinics.map((c) => (
                        <option key={c.clinicId} value={c.clinicId}>
                          {c.clinicName || c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">First Name *</label>
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name *</label>
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Date of Birth *</label>
                    <input
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Gender *</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Blood Group</label>
                    <select
                      value={form.bloodGroup}
                      onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Marital Status</label>
                    <select
                      value={form.maritalStatus}
                      onChange={(e) => setForm({ ...form, maritalStatus: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="">Select Marital Status</option>
                      <option value="Single">Single</option>
                      <option value="Married">Married</option>
                      <option value="Divorced">Divorced</option>
                      <option value="Widowed">Widowed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    required
                  >
                    <option value="Patient">Patient</option>
                  </select>
                </div>
              </div>
            )}

            {/* Contact Tab */}
            {activeTab === "contact" && (
              <div className="space-y-6">
                {/* Contact Information Section */}
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>📞</span> Contact Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        value={form.phoneNumber}
                        onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Alternate Phone</label>
                      <input
                        type="tel"
                        value={form.alternatePhone}
                        onChange={(e) => setForm({ ...form, alternatePhone: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="patient@example.com"
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="font-semibold text-slate-700 mb-3">Address</h4>
                    
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Address Line 1 *</label>
                      <input
                        type="text"
                        value={form.addressLine1}
                        onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        placeholder="Street address"
                        required
                      />
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Address Line 2</label>
                      <input
                        type="text"
                        value={form.addressLine2}
                        onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        placeholder="Apt, suite, unit, etc. (optional)"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">City *</label>
                        <input
                          type="text"
                          value={form.city}
                          onChange={(e) => setForm({ ...form, city: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                          placeholder="City"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">State/Province *</label>
                        <input
                          type="text"
                          value={form.state}
                          onChange={(e) => setForm({ ...form, state: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                          placeholder="State"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Postal Code *</label>
                        <input
                          type="text"
                          value={form.postalCode}
                          onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                          placeholder="12345"
                          required
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Country *</label>
                      <input
                        type="text"
                        value={form.country}
                        onChange={(e) => setForm({ ...form, country: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        placeholder="Country"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Emergency Contact Section */}
                <div className="pt-6 border-t border-slate-300">
                  <h3 className="text-lg font-bold text-slate-800 mb-4">🆘 Emergency Contact</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={form.emergencyContactName}
                        onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        placeholder="Emergency contact name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={form.emergencyContactPhone}
                        onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        placeholder="Emergency phone"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Relation</label>
                      <input
                        type="text"
                        value={form.emergencyContactRelation}
                        onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        placeholder="Spouse, Parent, etc."
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Medical Info Tab */}
            {activeTab === "medical-info" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>🏥</span> Medical Information
                  </h3>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Allergies</label>
                  <textarea
                    value={form.allergies}
                    onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    placeholder="List any known allergies (medications, food, environmental)"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Chronic Conditions</label>
                  <textarea
                    value={form.chronicConditions}
                    onChange={(e) => setForm({ ...form, chronicConditions: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    placeholder="Diabetes, hypertension, asthma, etc."
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Current Medications</label>
                  <textarea
                    value={form.currentMedications}
                    onChange={(e) => setForm({ ...form, currentMedications: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    placeholder="List all current medications and dosages"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Past Surgeries</label>
                  <textarea
                    value={form.pastSurgeries}
                    onChange={(e) => setForm({ ...form, pastSurgeries: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    placeholder="List any previous surgeries and dates"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Family Medical History</label>
                  <textarea
                    value={form.familyMedicalHistory}
                    onChange={(e) => setForm({ ...form, familyMedicalHistory: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    placeholder="Relevant family medical history"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Smoking Status</label>
                    <select
                      value={form.smokingStatus}
                      onChange={(e) => setForm({ ...form, smokingStatus: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="">Select Smoking Status</option>
                      <option value="Never">Never</option>
                      <option value="Former">Former</option>
                      <option value="Current">Current</option>
                      <option value="Occasional">Occasional</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Alcohol Consumption</label>
                    <select
                      value={form.alcoholConsumption}
                      onChange={(e) => setForm({ ...form, alcoholConsumption: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="">Select Alcohol Consumption</option>
                      <option value="None">None</option>
                      <option value="Occasional">Occasional</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Heavy">Heavy</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Exercise Frequency</label>
                    <select
                      value={form.exerciseFrequency}
                      onChange={(e) => setForm({ ...form, exerciseFrequency: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="">Select Exercise Frequency</option>
                      <option value="Sedentary">Sedentary</option>
                      <option value="Light">Light (1-2 days/week)</option>
                      <option value="Moderate">Moderate (3-4 days/week)</option>
                      <option value="Vigorous">Vigorous (5+ days/week)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Last Dental Visit</label>
                    <input
                      type="date"
                      value={form.lastDentalVisit}
                      onChange={(e) => setForm({ ...form, lastDentalVisit: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Dietary Restrictions</label>
                    <input
                      type="text"
                      value={form.dietaryRestrictions}
                      onChange={(e) => setForm({ ...form, dietaryRestrictions: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Vegetarian, vegan, gluten-free, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Additional Notes</label>
                  <textarea
                    value={form.additionalMedicalNotes}
                    onChange={(e) => setForm({ ...form, additionalMedicalNotes: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    placeholder="Any additional medical information"
                    rows="3"
                  />
                </div>
              </div>
            )}

            {/* Insurance Tab */}
            {activeTab === "insurance" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <span>💳</span> Insurance Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Insurance Provider</label>
                    <input
                      type="text"
                      value={form.insuranceProvider}
                      onChange={(e) => setForm({ ...form, insuranceProvider: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Insurance company name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Insurance Phone</label>
                    <input
                      type="tel"
                      value={form.insurancePhone}
                      onChange={(e) => setForm({ ...form, insurancePhone: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Insurance company phone"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Policy Number</label>
                    <input
                      type="text"
                      value={form.policyNumber}
                      onChange={(e) => setForm({ ...form, policyNumber: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Policy/Member ID"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Group Number</label>
                    <input
                      type="text"
                      value={form.groupNumber}
                      onChange={(e) => setForm({ ...form, groupNumber: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Group number (if applicable)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Coverage Percentage</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={form.coveragePercentage}
                      onChange={(e) => setForm({ ...form, coveragePercentage: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="80"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Policy Holder Name</label>
                    <input
                      type="text"
                      value={form.policyHolderName}
                      onChange={(e) => setForm({ ...form, policyHolderName: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                      placeholder="Name on insurance policy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Relationship to Policy Holder</label>
                    <select
                      value={form.relationshipToHolder}
                      onChange={(e) => setForm({ ...form, relationshipToHolder: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    >
                      <option value="">Select Relationship to Policy Holder</option>
                      <option value="Self">Self</option>
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Coverage Start Date</label>
                    <input
                      type="date"
                      value={form.coverageStartDate}
                      onChange={(e) => setForm({ ...form, coverageStartDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Coverage End Date</label>
                    <input
                      type="date"
                      value={form.coverageEndDate}
                      onChange={(e) => setForm({ ...form, coverageEndDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Copay Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2 text-slate-500 font-semibold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.copayAmount}
                        onChange={(e) => setForm({ ...form, copayAmount: e.target.value })}
                        className="w-full px-4 py-2 pl-8 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Deductible Amount</label>
                    <div className="relative">
                      <span className="absolute left-4 top-2 text-slate-500 font-semibold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={form.deductibleAmount}
                        onChange={(e) => setForm({ ...form, deductibleAmount: e.target.value })}
                        className="w-full px-4 py-2 pl-8 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 w-full">
                      <input
                        type="checkbox"
                        checked={form.isPrimaryInsurance}
                        onChange={(e) => setForm({ ...form, isPrimaryInsurance: e.target.checked })}
                        className="w-5 h-5 rounded border-slate-200 text-teal-500 focus:ring-2 focus:ring-teal-400"
                      />
                      <span className="text-sm font-semibold text-slate-700">Primary Insurance</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          {activeTab !== "insurance" && (
            <button
              onClick={handleNextTab}
              className="flex-1 px-6 py-3 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-colors"
            >
              Next →
            </button>
          )}
          {activeTab === "insurance" && (
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Registering..." : "💾 Register Patient"}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ========== INVENTORY MANAGEMENT MODALS ==========

export function InventoryListModal({
  show,
  onClose,
  items,
  loading,
  error,
  filterQuery,
  setFilterQuery,
  filterCategory,
  setFilterCategory,
  filterStatus,
  setFilterStatus,
  onEdit,
  onDelete,
  filteredItems = []
}) {
  const [expandedId, setExpandedId] = useState(null);

  if (!show) return null;

  const categories = [...new Set(items.map(item => item.category))];
  const statuses = ["Active", "Inactive"];

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-indigo-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">📦 Inventory Management</h2>
            <p className="text-violet-100 text-sm mt-1">Manage inventory items</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Filters */}
        <div className="border-b border-slate-200 p-6 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by item name or code..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-violet-500"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-40">
              <div className="text-lg text-slate-600">Loading inventory...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {filteredItems.length === 0 && !loading ? (
            <div className="text-center text-slate-500 py-8">No inventory items found</div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.itemId}
                  className="border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  onClick={() => setExpandedId(expandedId === item.itemId ? null : item.itemId)}
                >
                  <div className="p-4 bg-gradient-to-r from-violet-50 to-indigo-50 flex items-center justify-between cursor-pointer">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900">{item.itemName}</h3>
                      <p className="text-sm text-slate-600">Code: {item.itemCode}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        item.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="text-2xl">{expandedId === item.itemId ? "▼" : "▶"}</span>
                    </div>
                  </div>

                  {expandedId === item.itemId && (
                    <div className="p-4 border-t border-slate-200 bg-white space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-sm font-semibold text-slate-700">Category:</span>
                          <p className="text-slate-900">{item.category}</p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-700">Sub-Category:</span>
                          <p className="text-slate-900">{item.subCategory || "-"}</p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-700">Unit:</span>
                          <p className="text-slate-900">{item.unit}</p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-700">Created:</span>
                          <p className="text-slate-900">{new Date(item.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-4">
                        <button
                          onClick={() => onEdit(item)}
                          className="flex-1 px-4 py-2 bg-violet-500 text-white rounded-lg hover:bg-violet-600 transition-colors font-semibold"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => onDelete(item)}
                          className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function CreateInventoryModal({
  show,
  onClose,
  form,
  setForm,
  onSubmit,
  loading,
  error
}) {
  if (!show) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">➕ Add Inventory Item</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Item Name *</label>
            <input
              type="text"
              name="itemName"
              value={form.itemName}
              onChange={handleChange}
              placeholder="e.g., Dental Braces, Filling Material"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Item Code (SKU) *</label>
            <input
              type="text"
              name="itemCode"
              value={form.itemCode}
              onChange={handleChange}
              placeholder="e.g., DB-001"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                <option value="Supplies">Supplies</option>
                <option value="Equipment">Equipment</option>
                <option value="Medication">Medication</option>
                <option value="Consumables">Consumables</option>
                <option value="Instruments">Instruments</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sub-Category</label>
              <input
                type="text"
                name="subCategory"
                value={form.subCategory}
                onChange={handleChange}
                placeholder="e.g., Orthodontic"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Unit *</label>
              <select
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                required
              >
                <option value="Box">Box</option>
                <option value="Piece">Piece</option>
                <option value="Bottle">Bottle</option>
                <option value="Tablet">Tablet</option>
                <option value="Pack">Pack</option>
                <option value="Unit">Unit</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-slate-300 text-violet-500 focus:ring-2 focus:ring-violet-500"
                />
                <span className="text-sm font-semibold text-slate-700">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? "Creating..." : "💾 Create Item"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function EditInventoryModal({
  show,
  onClose,
  form,
  setForm,
  onSubmit,
  loading,
  error
}) {
  if (!show) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">✏️ Edit Inventory Item</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Item Name *</label>
            <input
              type="text"
              name="itemName"
              value={form?.itemName || ""}
              onChange={handleChange}
              placeholder="e.g., Dental Braces, Filling Material"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Item Code (SKU) *</label>
            <input
              type="text"
              name="itemCode"
              value={form?.itemCode || ""}
              onChange={handleChange}
              placeholder="e.g., DB-001"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Category *</label>
              <select
                name="category"
                value={form?.category || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                <option value="Supplies">Supplies</option>
                <option value="Equipment">Equipment</option>
                <option value="Medication">Medication</option>
                <option value="Consumables">Consumables</option>
                <option value="Instruments">Instruments</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Sub-Category</label>
              <input
                type="text"
                name="subCategory"
                value={form?.subCategory || ""}
                onChange={handleChange}
                placeholder="e.g., Orthodontic"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Unit *</label>
              <select
                name="unit"
                value={form?.unit || ""}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                required
              >
                <option value="Box">Box</option>
                <option value="Piece">Piece</option>
                <option value="Bottle">Bottle</option>
                <option value="Tablet">Tablet</option>
                <option value="Pack">Pack</option>
                <option value="Unit">Unit</option>
              </select>
            </div>

            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form?.isActive || false}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-slate-300 text-violet-500 focus:ring-2 focus:ring-violet-500"
                />
                <span className="text-sm font-semibold text-slate-700">Active</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50"
          >
            {loading ? "Updating..." : "💾 Update Item"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DeleteInventoryModal({
  show,
  onClose,
  item,
  onConfirm,
  loading
}) {
  if (!show) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6">
          <h2 className="text-2xl font-bold">⚠️ Delete Inventory Item</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-slate-700">
            Are you sure you want to delete the inventory item <strong>{item?.itemName}</strong> (Code: {item?.itemCode})?
          </p>
          <p className="text-slate-600 text-sm">
            This action cannot be undone.
          </p>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-6 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Deleting..." : "🗑️ Delete"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ========== PATIENT MANAGEMENT MODALS ==========

export function ManagePatientModal({
  show,
  onClose,
  searchId,
  setSearchId,
  onSearch,
  patientProfile,
  loading,
  error
}) {
  if (!show) return null;

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">👤 Manage Patients</h2>
            <p className="text-cyan-100 text-sm mt-1">Search and view patient profiles</p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Search Section */}
        <div className="border-b border-slate-200 p-6 bg-slate-50">
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Enter Patient ID..."
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <button
              onClick={onSearch}
              disabled={loading || !searchId}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? "Searching..." : "🔍 Search"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 p-4 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center h-40">
              <div className="text-lg text-slate-600">Loading patient profile...</div>
            </div>
          )}

          {patientProfile && !loading && (
            <div className="space-y-6">
              {/* Patient Information Card */}
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span>👤</span> Patient Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Patient ID:</span>
                    <p className="text-slate-900 font-medium">{patientProfile.patientId}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Full Name:</span>
                    <p className="text-slate-900 font-medium">{patientProfile.firstName} {patientProfile.lastName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Date of Birth:</span>
                    <p className="text-slate-900">{patientProfile.dateOfBirth ? new Date(patientProfile.dateOfBirth).toLocaleDateString() : '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Gender:</span>
                    <p className="text-slate-900">{patientProfile.gender || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Blood Group:</span>
                    <p className="text-slate-900">{patientProfile.bloodGroup || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Marital Status:</span>
                    <p className="text-slate-900">{patientProfile.maritalStatus || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information Card */}
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <span>📞</span> Contact Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Phone Number:</span>
                    <p className="text-slate-900">{patientProfile.phoneNumber || '-'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Email:</span>
                    <p className="text-slate-900">{patientProfile.email || '-'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-sm font-semibold text-slate-700">Address:</span>
                    <p className="text-slate-900">
                      {[
                        patientProfile.addressLine1,
                        patientProfile.addressLine2,
                        patientProfile.city,
                        patientProfile.state,
                        patientProfile.postalCode,
                        patientProfile.country
                      ].filter(Boolean).join(', ') || '-'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-slate-700">Emergency Contact:</span>
                    <p className="text-slate-900">{patientProfile.emergencyContactName || '-'}</p>
                    <p className="text-sm text-slate-600">{patientProfile.emergencyContactPhone || ''}</p>
                  </div>
                </div>
              </div>

              {/* Medical Information Card */}
              {(patientProfile.allergies || patientProfile.chronicConditions || patientProfile.currentMedications) && (
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span>🏥</span> Medical Information
                  </h3>
                  <div className="space-y-3">
                    {patientProfile.allergies && (
                      <div>
                        <span className="text-sm font-semibold text-slate-700">Allergies:</span>
                        <p className="text-slate-900">{patientProfile.allergies}</p>
                      </div>
                    )}
                    {patientProfile.chronicConditions && (
                      <div>
                        <span className="text-sm font-semibold text-slate-700">Chronic Conditions:</span>
                        <p className="text-slate-900">{patientProfile.chronicConditions}</p>
                      </div>
                    )}
                    {patientProfile.currentMedications && (
                      <div>
                        <span className="text-sm font-semibold text-slate-700">Current Medications:</span>
                        <p className="text-slate-900">{patientProfile.currentMedications}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Insurance Information Card */}
              {patientProfile.insuranceProvider && (
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <span>🛡️</span> Insurance Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm font-semibold text-slate-700">Provider:</span>
                      <p className="text-slate-900">{patientProfile.insuranceProvider}</p>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-700">Policy Number:</span>
                      <p className="text-slate-900">{patientProfile.policyNumber || '-'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-slate-700">Policy Holder:</span>
                      <p className="text-slate-900">{patientProfile.policyHolderName || '-'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {!patientProfile && !loading && !error && (
            <div className="text-center text-slate-500 py-12">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg">Enter a Patient ID to search</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-6 flex justify-between items-center">
          {patientProfile && (
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (window.editPatientHandler) {
                    window.editPatientHandler(patientProfile);
                  }
                }}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold hover:shadow-lg transition-all"
              >
                ✏️ Edit Patient
              </button>
              <button
                onClick={() => {
                  if (window.deletePatientHandler) {
                    window.deletePatientHandler(patientProfile);
                  }
                }}
                className="px-6 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors"
              >
                🗑️ Delete Patient
              </button>
            </div>
          )}
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition-colors ml-auto"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}