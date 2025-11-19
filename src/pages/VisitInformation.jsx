import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Sample data - replace with actual API calls
const SAMPLE_VISITS = [
  {
    visitId: 1,
    patientId: 1,
    patientName: "Priya Sharma",
    patientAge: 35,
    patientGender: "Female",
    clinicId: 1,
    clinicName: "Dentaesthetics Mumbai Central",
    visitDate: "2025-11-15",
    reasonForVisit: "Routine Checkup",
    diagnoses: "Mild gingivitis, Early stage cavity on tooth #18",
    treatments: "Dental cleaning, Fluoride treatment",
    prescriptions: "Chlorhexidine mouthwash 0.2% - Use twice daily for 2 weeks",
    notes: "Patient reports sensitivity to cold. Recommend follow-up in 3 months.",
    nextAppointmentDate: "2025-02-15",
    attendingPhysician: "Dr. Rajesh Kumar",
    billingAmount: 20750.00,
    paymentStatus: "Paid"
  },
  {
    visitId: 2,
    patientId: 2,
    patientName: "Arjun Patel",
    patientAge: 42,
    patientGender: "Male",
    clinicId: 1,
    clinicName: "Dentaesthetics Mumbai Central",
    visitDate: "2025-11-08",
    reasonForVisit: "Toothache",
    diagnoses: "Pulpitis in tooth #30, Requires root canal treatment",
    treatments: "Emergency pain management, Root canal therapy scheduled",
    prescriptions: "Ibuprofen 400mg - Take every 6 hours as needed for pain",
    notes: "Patient experiencing severe pain. Root canal scheduled for next week.",
    nextAppointmentDate: "2025-11-22",
    attendingPhysician: "Dr. Rajesh Kumar",
    billingAmount: 99600.00,
    paymentStatus: "Pending"
  },
  {
    visitId: 3,
    patientId: 3,
    patientName: "Anjali Reddy",
    patientAge: 28,
    patientGender: "Female",
    clinicId: 1,
    clinicName: "Dentaesthetics Mumbai Central",
    visitDate: "2025-11-05",
    reasonForVisit: "Dental filling",
    diagnoses: "Cavity on tooth #14",
    treatments: "Composite filling placement",
    prescriptions: "No prescription needed",
    notes: "Procedure completed successfully. No complications.",
    nextAppointmentDate: "2025-05-05",
    attendingPhysician: "Dr. Rajesh Kumar",
    billingAmount: 37350.00,
    paymentStatus: "Paid"
  }
];

// Doctor information - should come from authentication context
const CURRENT_DOCTOR = {
  doctorId: 1,
  name: "Dr. Rajesh Kumar",
  registrationNumber: "MCI-A-12345-MH",
  specialization: "General Dentistry & Oral Medicine"
};

export default function VisitInformation() {
  const navigate = useNavigate();
  const [visits, setVisits] = useState(SAMPLE_VISITS);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionText, setPrescriptionText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [successMessage, setSuccessMessage] = useState("");

  // Filter visits based on search and status
  const filteredVisits = visits.filter(visit => {
    const matchesSearch = 
      visit.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.diagnoses.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.reasonForVisit.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || visit.paymentStatus.toLowerCase() === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (visit) => {
    setSelectedVisit(visit);
  };

  const handleOpenPrescription = (visit) => {
    setSelectedVisit(visit);
    setPrescriptionText(visit.prescriptions || "");
    setShowPrescriptionModal(true);
  };

  const handleSaveAndSend = () => {
    // Here you would make an API call to save the prescription
    console.log("Saving prescription for visit:", selectedVisit.visitId);
    console.log("Prescription content:", prescriptionText);
    
    // Update the visit with new prescription
    const updatedVisits = visits.map(v => 
      v.visitId === selectedVisit.visitId 
        ? { ...v, prescriptions: prescriptionText }
        : v
    );
    setVisits(updatedVisits);
    
    // Show success message
    setSuccessMessage("Prescription saved and sent successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
    
    // Close modal
    setShowPrescriptionModal(false);
    setPrescriptionText("");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'paid':
        return 'from-emerald-500 to-teal-500';
      case 'pending':
        return 'from-amber-500 to-orange-500';
      case 'overdue':
        return 'from-red-500 to-rose-500';
      default:
        return 'from-slate-500 to-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50/40 to-pink-50/30 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent mb-2">
              Visit Information
            </h1>
            <p className="text-slate-600">Manage patient visits, diagnoses, and prescriptions</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
          >
            ← Back
          </motion.button>
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-3 rounded-lg shadow-lg mb-4"
            >
              ✓ {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Search and Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-purple-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by patient name, diagnosis, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-3 rounded-lg border border-purple-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Visits List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredVisits.map((visit, index) => (
          <motion.div
            key={visit.visitId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg hover:shadow-xl transition-all border border-purple-100 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-4 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
                    {visit.patientName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{visit.patientName}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span>{visit.patientAge} yrs • {visit.patientGender}</span>
                      <span className="text-purple-600">Visit ID: #{visit.visitId}</span>
                    </div>
                  </div>
                </div>
                <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${getStatusColor(visit.paymentStatus)} text-white font-semibold text-sm shadow-md`}>
                  {visit.paymentStatus}
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                  <p className="text-xs font-semibold text-purple-600 mb-1">VISIT DATE</p>
                  <p className="text-slate-800 font-medium">📅 {formatDate(visit.visitDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-600 mb-1">CLINIC</p>
                  <p className="text-slate-800 font-medium">🏥 {visit.clinicName}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-600 mb-1">ATTENDING PHYSICIAN</p>
                  <p className="text-slate-800 font-medium">👨‍⚕️ {visit.attendingPhysician}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-600 mb-1">REASON FOR VISIT</p>
                  <p className="text-slate-800 font-medium">{visit.reasonForVisit}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-600 mb-1">BILLING AMOUNT</p>
                  <p className="text-slate-800 font-medium text-lg">₹{visit.billingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-purple-600 mb-1">NEXT APPOINTMENT</p>
                  <p className="text-slate-800 font-medium">{formatDate(visit.nextAppointmentDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-sm font-semibold text-purple-700 mb-2">DIAGNOSIS</p>
                  <p className="text-slate-700">{visit.diagnoses}</p>
                </div>
                <div className="bg-gradient-to-r from-violet-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-sm font-semibold text-purple-700 mb-2">TREATMENTS</p>
                  <p className="text-slate-700">{visit.treatments}</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-100 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-teal-700">CURRENT PRESCRIPTION</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOpenPrescription(visit)}
                    className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    📝 Edit Prescription
                  </motion.button>
                </div>
                <p className="text-slate-700">{visit.prescriptions}</p>
              </div>

              <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm font-semibold text-slate-700 mb-2">NOTES</p>
                <p className="text-slate-600 text-sm">{visit.notes}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {filteredVisits.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white/80 rounded-xl shadow-lg"
          >
            <p className="text-slate-500 text-lg">No visits found matching your criteria.</p>
          </motion.div>
        )}
      </div>

      {/* Prescription Modal */}
      <AnimatePresence>
        {showPrescriptionModal && selectedVisit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPrescriptionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-violet-500 to-purple-500 px-8 py-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold">Prescription</h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowPrescriptionModal(false)}
                    className="text-white hover:bg-white/20 w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  >
                    ✕
                  </motion.button>
                </div>
                
                {/* Doctor Information */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-purple-100 text-sm mb-1">Doctor Name</p>
                      <p className="font-bold text-lg">{CURRENT_DOCTOR.name}</p>
                    </div>
                    <div>
                      <p className="text-purple-100 text-sm mb-1">Registration Number</p>
                      <p className="font-bold text-lg">{CURRENT_DOCTOR.registrationNumber}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <p className="text-purple-100 text-sm">Specialization: {CURRENT_DOCTOR.specialization}</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 overflow-y-auto max-h-[60vh]">
                {/* Patient Information */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 mb-6 border border-purple-100">
                  <h3 className="text-lg font-bold text-purple-900 mb-3">Patient Information</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-purple-600 font-semibold mb-1">NAME</p>
                      <p className="text-slate-800 font-medium">{selectedVisit.patientName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 font-semibold mb-1">AGE / GENDER</p>
                      <p className="text-slate-800 font-medium">{selectedVisit.patientAge} yrs / {selectedVisit.patientGender}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 font-semibold mb-1">VISIT DATE</p>
                      <p className="text-slate-800 font-medium">{formatDate(selectedVisit.visitDate)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 font-semibold mb-1">VISIT ID</p>
                      <p className="text-slate-800 font-medium">#{selectedVisit.visitId}</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <p className="text-xs text-purple-600 font-semibold mb-1">DIAGNOSIS</p>
                    <p className="text-slate-800">{selectedVisit.diagnoses}</p>
                  </div>
                </div>

                {/* Prescription Text Area */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-3">
                    Prescription Details
                  </label>
                  <textarea
                    value={prescriptionText}
                    onChange={(e) => setPrescriptionText(e.target.value)}
                    placeholder="Enter prescription details here...&#10;&#10;Example:&#10;Rx&#10;1. Amoxicillin 500mg - Take 1 capsule three times daily for 7 days&#10;2. Ibuprofen 400mg - Take as needed for pain, every 6-8 hours&#10;3. Chlorhexidine mouthwash 0.2% - Rinse twice daily after brushing&#10;&#10;Instructions: Avoid hard foods, maintain oral hygiene"
                    className="w-full h-64 px-4 py-3 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-400 focus:border-transparent outline-none resize-none font-mono text-sm"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    This prescription will be saved with the patient's visit information.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPrescriptionModal(false)}
                    className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveAndSend}
                    disabled={!prescriptionText.trim()}
                    className={`px-8 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all text-white ${
                      prescriptionText.trim()
                        ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700'
                        : 'bg-gradient-to-r from-slate-300 to-slate-400 cursor-not-allowed'
                    }`}
                  >
                    💾 Save & Send Prescription
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
