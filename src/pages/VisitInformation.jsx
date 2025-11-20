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
    paymentStatus: "Paid",
    medicalConditions: {
      chronicDiseases: ["Type 2 Diabetes Mellitus"],
      allergies: ["Penicillin"],
      currentMedications: ["Metformin 500mg twice daily"],
      bloodPressure: "Normal",
      notes: "Monitor blood sugar levels before procedures"
    }
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
    paymentStatus: "Pending",
    medicalConditions: {
      chronicDiseases: ["Hypertension", "Cardiovascular Disease"],
      allergies: ["Aspirin", "Codeine"],
      currentMedications: ["Amlodipine 5mg daily", "Atorvastatin 20mg daily"],
      bloodPressure: "145/92 (Elevated)",
      notes: "Avoid NSAIDs due to cardiovascular condition. Use alternative pain management."
    }
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
    paymentStatus: "Paid",
    medicalConditions: {
      chronicDiseases: [],
      allergies: [],
      currentMedications: [],
      bloodPressure: "Normal",
      notes: "No significant medical history"
    }
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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentVisit, setPaymentVisit] = useState(null);
  const [newPaymentStatus, setNewPaymentStatus] = useState("");

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

  const handleOpenPaymentModal = (visit) => {
    setPaymentVisit(visit);
    setNewPaymentStatus(visit.paymentStatus);
    setShowPaymentModal(true);
  };

  const handleUpdatePaymentStatus = () => {
    // Here you would make an API call to update payment status
    console.log("Updating payment status for visit:", paymentVisit.visitId);
    console.log("New status:", newPaymentStatus);
    
    // Update the visit with new payment status
    const updatedVisits = visits.map(v => 
      v.visitId === paymentVisit.visitId 
        ? { ...v, paymentStatus: newPaymentStatus }
        : v
    );
    setVisits(updatedVisits);
    
    // Show success message
    setSuccessMessage(`Payment status updated to "${newPaymentStatus}" successfully!`);
    setTimeout(() => setSuccessMessage(""), 3000);
    
    // Close modal
    setShowPaymentModal(false);
    setPaymentVisit(null);
  };

  const handlePrintPrescription = () => {
    const printWindow = window.open('', '_blank');
    const prescriptionContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prescription - ${selectedVisit.patientName}</title>
          <style>
            body {
              font-family: 'Times New Roman', serif;
              padding: 40px;
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 3px double #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              margin: 0;
              color: #8b5cf6;
              font-size: 28px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            .section {
              margin-bottom: 20px;
            }
            .section-title {
              font-weight: bold;
              color: #8b5cf6;
              border-bottom: 1px solid #ddd;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .patient-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 30px;
            }
            .info-item {
              display: flex;
              gap: 10px;
            }
            .info-label {
              font-weight: bold;
              color: #555;
            }
            .prescription-body {
              white-space: pre-wrap;
              line-height: 1.8;
              padding: 20px;
              background: #f9f9f9;
              border-left: 4px solid #8b5cf6;
              margin: 20px 0;
              font-family: 'Courier New', monospace;
            }
            .medical-alert {
              background: #fff3cd;
              border: 2px solid #dc3545;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            }
            .medical-alert h3 {
              color: #dc3545;
              margin: 0 0 10px 0;
              font-size: 16px;
              font-weight: bold;
            }
            .medical-alert ul {
              margin: 5px 0;
              padding-left: 20px;
            }
            .medical-alert li {
              color: #333;
              font-weight: bold;
              margin: 3px 0;
            }
            .alert-section {
              margin: 10px 0;
            }
            .alert-section strong {
              color: #dc3545;
            }
            .footer {
              margin-top: 60px;
              border-top: 1px solid #ddd;
              padding-top: 20px;
            }
            .signature {
              margin-top: 40px;
              text-align: right;
            }
            .signature-line {
              border-top: 1px solid #333;
              width: 200px;
              margin-left: auto;
              margin-bottom: 5px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MEDICAL PRESCRIPTION</h1>
            <p><strong>${CURRENT_DOCTOR.name}</strong></p>
            <p>${CURRENT_DOCTOR.specialization}</p>
            <p>Reg. No: ${CURRENT_DOCTOR.registrationNumber}</p>
            <p>Date: ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <div class="section">
            <div class="section-title">PATIENT INFORMATION</div>
            <div class="patient-info">
              <div class="info-item">
                <span class="info-label">Name:</span>
                <span>${selectedVisit.patientName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Age:</span>
                <span>${selectedVisit.patientAge} years</span>
              </div>
              <div class="info-item">
                <span class="info-label">Gender:</span>
                <span>${selectedVisit.patientGender}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Visit ID:</span>
                <span>#${selectedVisit.visitId}</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">DIAGNOSIS</div>
            <p>${selectedVisit.diagnoses}</p>
          </div>

          ${selectedVisit.medicalConditions && (
            selectedVisit.medicalConditions.chronicDiseases?.length > 0 || 
            selectedVisit.medicalConditions.allergies?.length > 0 ||
            selectedVisit.medicalConditions.currentMedications?.length > 0
          ) ? `
          <div class="medical-alert">
            <h3>⚠️ MEDICAL ALERTS - CRITICAL INFORMATION</h3>
            ${selectedVisit.medicalConditions.chronicDiseases?.length > 0 ? `
            <div class="alert-section">
              <strong>🏥 Chronic Conditions:</strong>
              <ul>
                ${selectedVisit.medicalConditions.chronicDiseases.map(disease => `<li>${disease}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            ${selectedVisit.medicalConditions.allergies?.length > 0 ? `
            <div class="alert-section">
              <strong>⚠️ Drug Allergies:</strong>
              <ul>
                ${selectedVisit.medicalConditions.allergies.map(allergy => `<li>${allergy}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            ${selectedVisit.medicalConditions.currentMedications?.length > 0 ? `
            <div class="alert-section">
              <strong>💊 Current Medications:</strong>
              <ul>
                ${selectedVisit.medicalConditions.currentMedications.map(med => `<li>${med}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            ${selectedVisit.medicalConditions.bloodPressure && selectedVisit.medicalConditions.bloodPressure !== 'Normal' ? `
            <div class="alert-section">
              <strong>🩺 Blood Pressure:</strong> ${selectedVisit.medicalConditions.bloodPressure}
            </div>
            ` : ''}
            ${selectedVisit.medicalConditions.notes && selectedVisit.medicalConditions.notes !== 'No significant medical history' ? `
            <div class="alert-section">
              <strong>📋 Clinical Notes:</strong> ${selectedVisit.medicalConditions.notes}
            </div>
            ` : ''}
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">PRESCRIPTION</div>
            <div class="prescription-body">${prescriptionText || 'No prescription provided'}</div>
          </div>

          <div class="footer">
            <div class="signature">
              <div class="signature-line"></div>
              <p><strong>${CURRENT_DOCTOR.name}</strong></p>
              <p>${CURRENT_DOCTOR.specialization}</p>
              <p>Reg. No: ${CURRENT_DOCTOR.registrationNumber}</p>
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(prescriptionContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenPaymentModal(visit);
                  }}
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r ${getStatusColor(visit.paymentStatus)} text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all cursor-pointer`}
                  title="Click to change payment status"
                >
                  {visit.paymentStatus} 💳
                </motion.button>
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
                    📝 Write Prescription
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
                  <h2 className="text-3xl font-bold">Medical Prescription</h2>
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

                {/* Medical Alert Section */}
                {selectedVisit.medicalConditions && (
                  selectedVisit.medicalConditions.chronicDiseases?.length > 0 || 
                  selectedVisit.medicalConditions.allergies?.length > 0 ||
                  selectedVisit.medicalConditions.currentMedications?.length > 0 ||
                  selectedVisit.medicalConditions.bloodPressure !== "Normal"
                ) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border-2 border-red-300 rounded-lg p-6 mb-6 shadow-lg"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div className="bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl flex-shrink-0 animate-pulse">
                        ⚠️
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-red-900 mb-1">MEDICAL ALERTS - Critical Information</h3>
                        <p className="text-sm text-red-700">Please review patient's medical conditions before prescribing medications</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Chronic Diseases */}
                      {selectedVisit.medicalConditions.chronicDiseases?.length > 0 && (
                        <div className="bg-white/80 rounded-lg p-4 border-l-4 border-red-500">
                          <p className="text-xs font-bold text-red-700 mb-2 flex items-center gap-2">
                            🏥 CHRONIC CONDITIONS
                          </p>
                          <ul className="space-y-1">
                            {selectedVisit.medicalConditions.chronicDiseases.map((disease, idx) => (
                              <li key={idx} className="text-sm text-slate-800 font-semibold flex items-center gap-2">
                                <span className="text-red-500">●</span> {disease}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Allergies */}
                      {selectedVisit.medicalConditions.allergies?.length > 0 && (
                        <div className="bg-white/80 rounded-lg p-4 border-l-4 border-orange-500">
                          <p className="text-xs font-bold text-orange-700 mb-2 flex items-center gap-2">
                            ⚠️ DRUG ALLERGIES
                          </p>
                          <ul className="space-y-1">
                            {selectedVisit.medicalConditions.allergies.map((allergy, idx) => (
                              <li key={idx} className="text-sm text-slate-800 font-semibold flex items-center gap-2">
                                <span className="text-orange-500">●</span> {allergy}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Current Medications */}
                      {selectedVisit.medicalConditions.currentMedications?.length > 0 && (
                        <div className="bg-white/80 rounded-lg p-4 border-l-4 border-blue-500">
                          <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-2">
                            💊 CURRENT MEDICATIONS
                          </p>
                          <ul className="space-y-1">
                            {selectedVisit.medicalConditions.currentMedications.map((med, idx) => (
                              <li key={idx} className="text-sm text-slate-800 flex items-center gap-2">
                                <span className="text-blue-500">●</span> {med}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Blood Pressure */}
                      {selectedVisit.medicalConditions.bloodPressure && selectedVisit.medicalConditions.bloodPressure !== "Normal" && (
                        <div className="bg-white/80 rounded-lg p-4 border-l-4 border-purple-500">
                          <p className="text-xs font-bold text-purple-700 mb-2 flex items-center gap-2">
                            🩺 BLOOD PRESSURE
                          </p>
                          <p className="text-sm text-slate-800 font-semibold">
                            {selectedVisit.medicalConditions.bloodPressure}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Additional Notes */}
                    {selectedVisit.medicalConditions.notes && selectedVisit.medicalConditions.notes !== "No significant medical history" && (
                      <div className="mt-4 bg-amber-100 border border-amber-300 rounded-lg p-3">
                        <p className="text-xs font-bold text-amber-900 mb-1">📋 CLINICAL NOTES</p>
                        <p className="text-sm text-amber-900 italic">{selectedVisit.medicalConditions.notes}</p>
                      </div>
                    )}
                  </motion.div>
                )}

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
                <div className="flex gap-4 justify-between">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowPrescriptionModal(false)}
                    className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                  >
                    Cancel
                  </motion.button>
                  <div className="flex gap-4">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePrintPrescription}
                      disabled={!prescriptionText.trim()}
                      className={`px-6 py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all ${
                        prescriptionText.trim()
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white hover:from-teal-600 hover:to-cyan-700'
                          : 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      🖨️ Print
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
                      💾 Save & Send
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Payment Status Modal */}
      <AnimatePresence>
        {showPaymentModal && paymentVisit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowPaymentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Update Payment Status</h2>
                  <p className="text-sm text-slate-600">Visit ID: #{paymentVisit.visitId} - {paymentVisit.patientName}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowPaymentModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ✕
                </motion.button>
              </div>

              {/* Current Status */}
              <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg p-4 mb-6 border border-slate-200">
                <p className="text-xs font-semibold text-slate-600 mb-2">CURRENT STATUS</p>
                <div className="flex items-center justify-between">
                  <span className={`px-4 py-2 rounded-lg bg-gradient-to-r ${getStatusColor(paymentVisit.paymentStatus)} text-white font-semibold text-sm shadow-md`}>
                    {paymentVisit.paymentStatus}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">Billing Amount</p>
                    <p className="text-xl font-bold text-slate-800">₹{paymentVisit.billingAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
              </div>

              {/* Payment Status Options */}
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-3">
                  Select New Payment Status
                </label>
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setNewPaymentStatus("Paid")}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                      newPaymentStatus === "Paid"
                        ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-teal-50'
                        : 'border-slate-200 hover:border-emerald-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        newPaymentStatus === "Paid" ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                      }`}>
                        {newPaymentStatus === "Paid" && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="font-semibold text-slate-800">Paid</span>
                    </div>
                    <span className="px-3 py-1 rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold">
                      ✓ Completed
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setNewPaymentStatus("Pending")}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                      newPaymentStatus === "Pending"
                        ? 'border-amber-500 bg-gradient-to-r from-amber-50 to-orange-50'
                        : 'border-slate-200 hover:border-amber-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        newPaymentStatus === "Pending" ? 'border-amber-500 bg-amber-500' : 'border-slate-300'
                      }`}>
                        {newPaymentStatus === "Pending" && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="font-semibold text-slate-800">Pending</span>
                    </div>
                    <span className="px-3 py-1 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold">
                      ⏳ Awaiting
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setNewPaymentStatus("Overdue")}
                    className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-between ${
                      newPaymentStatus === "Overdue"
                        ? 'border-red-500 bg-gradient-to-r from-red-50 to-rose-50'
                        : 'border-slate-200 hover:border-red-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        newPaymentStatus === "Overdue" ? 'border-red-500 bg-red-500' : 'border-slate-300'
                      }`}>
                        {newPaymentStatus === "Overdue" && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span className="font-semibold text-slate-800">Overdue</span>
                    </div>
                    <span className="px-3 py-1 rounded-md bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold">
                      ⚠️ Action Required
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpdatePaymentStatus}
                  disabled={newPaymentStatus === paymentVisit.paymentStatus}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold shadow-lg transition-all ${
                    newPaymentStatus !== paymentVisit.paymentStatus
                      ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-xl'
                      : 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  💳 Update Status
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
