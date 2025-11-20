import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Sample clinics data
const SAMPLE_CLINICS = [
  { clinicId: 101, clinicName: "Dentaesthetics Mumbai Central", city: "Mumbai" },
  { clinicId: 102, clinicName: "Smile Care Bangalore", city: "Bangalore" },
  { clinicId: 103, clinicName: "Pearl Dental Clinic Delhi", city: "Delhi" },
  { clinicId: 104, clinicName: "Sunshine Dental Care Pune", city: "Pune" },
  { clinicId: 105, clinicName: "Bright Smiles Hyderabad", city: "Hyderabad" },
  { clinicId: 106, clinicName: "Elite Dental Care Chennai", city: "Chennai" }
];

// Sample data for demonstration - staff assigned to different clinics
const SAMPLE_DOCTORS = [
  // Mumbai Central - Clinic 101
  {
    doctorId: 1,
    doctorName: "Dr. Rajesh Kumar",
    specialty: "Orthodontist",
    registrationNumber: "MCI-A-12345-MH",
    clinicId: 101,
    clinicName: "Dentaesthetics Mumbai Central",
    staffType: "doctor",
    fixedSalary: 150000,
    totalPatientsThisMonth: 42,
    totalRevenueGenerated: 8350000,
    salaryHistory: [
      {
        historyId: 1,
        doctorId: 1,
        fixedSalary: 150000,
        effectiveDate: "2025-01-01",
        endDate: null,
        remarks: "Annual increment 2025",
        updatedBy: "Admin",
        updatedAt: "2025-01-01T10:00:00"
      },
      {
        historyId: 2,
        doctorId: 1,
        fixedSalary: 135000,
        effectiveDate: "2024-01-01",
        endDate: "2024-12-31",
        remarks: "Annual increment 2024",
        updatedBy: "Admin",
        updatedAt: "2024-01-01T10:00:00"
      },
      {
        historyId: 3,
        doctorId: 1,
        fixedSalary: 120000,
        effectiveDate: "2023-01-01",
        endDate: "2023-12-31",
        remarks: "Initial salary on joining",
        updatedBy: "HR Manager",
        updatedAt: "2023-01-01T09:00:00"
      }
    ]
  },
  {
    doctorId: 2,
    doctorName: "Dr. Priya Sharma",
    specialty: "Endodontist",
    registrationNumber: "MCI-A-23456-MH",
    clinicId: 101,
    clinicName: "Dentaesthetics Mumbai Central",
    staffType: "doctor",
    fixedSalary: 135000,
    totalPatientsThisMonth: 38,
    totalRevenueGenerated: 6825000
  },
  {
    doctorId: 3,
    doctorName: "Kavya Menon",
    specialty: "Dental Hygienist",
    registrationNumber: "DH-101-MH",
    clinicId: 101,
    clinicName: "Dentaesthetics Mumbai Central",
    staffType: "hygienist",
    fixedSalary: 45000,
    totalPatientsThisMonth: 65,
    totalRevenueGenerated: 1950000
  },
  // Bangalore - Clinic 102
  {
    doctorId: 4,
    doctorName: "Dr. Arjun Patel",
    specialty: "Oral Surgeon",
    registrationNumber: "MCI-A-34567-KA",
    clinicId: 102,
    clinicName: "Dentaesthetics Bangalore Whitefield",
    staffType: "doctor",
    fixedSalary: 175000,
    totalPatientsThisMonth: 35,
    totalRevenueGenerated: 10450000,
    salaryHistory: [
      {
        historyId: 10,
        doctorId: 4,
        fixedSalary: 175000,
        effectiveDate: "2024-07-01",
        endDate: null,
        remarks: "Promotion to Senior Oral Surgeon",
        updatedBy: "Admin",
        updatedAt: "2024-07-01T11:30:00"
      },
      {
        historyId: 11,
        doctorId: 4,
        fixedSalary: 150000,
        effectiveDate: "2023-07-01",
        endDate: "2024-06-30",
        remarks: "Starting salary",
        updatedBy: "HR Manager",
        updatedAt: "2023-07-01T10:00:00"
      }
    ]
  },
  {
    doctorId: 5,
    doctorName: "Dr. Sneha Iyer",
    specialty: "Periodontist",
    registrationNumber: "MCI-A-45678-KA",
    clinicId: 102,
    clinicName: "Smile Care Bangalore",
    staffType: "doctor",
    fixedSalary: 140000,
    totalPatientsThisMonth: 35,
    totalRevenueGenerated: 5950000
  },
  {
    doctorId: 6,
    doctorName: "Aditya Gupta",
    specialty: "Dental Assistant",
    registrationNumber: "DA-102-KA",
    clinicId: 102,
    clinicName: "Smile Care Bangalore",
    staffType: "assistant",
    fixedSalary: 35000,
    totalPatientsThisMonth: 70,
    totalRevenueGenerated: 0
  },
  // Delhi - Clinic 103
  {
    doctorId: 7,
    doctorName: "Dr. Anjali Reddy",
    specialty: "Prosthodontist",
    registrationNumber: "MCI-A-56789-DL",
    clinicId: 103,
    clinicName: "Pearl Dental Clinic Delhi",
    staffType: "doctor",
    fixedSalary: 145000,
    totalPatientsThisMonth: 31,
    totalRevenueGenerated: 7225000
  },
  {
    doctorId: 8,
    doctorName: "Dr. Vikram Singh",
    specialty: "Endodontist",
    registrationNumber: "MCI-A-67890-DL",
    clinicId: 103,
    clinicName: "Pearl Dental Clinic Delhi",
    staffType: "doctor",
    fixedSalary: 138000,
    totalPatientsThisMonth: 29,
    totalRevenueGenerated: 6380000
  },
  // Pune - Clinic 104
  {
    doctorId: 9,
    doctorName: "Dr. Meera Nair",
    specialty: "Cosmetic Dentist",
    registrationNumber: "MCI-A-78901-MH",
    clinicId: 104,
    clinicName: "Sunshine Dental Care Pune",
    staffType: "doctor",
    fixedSalary: 160000,
    totalPatientsThisMonth: 25,
    totalRevenueGenerated: 8750000
  },
  {
    doctorId: 10,
    doctorName: "Rahul Verma",
    specialty: "Dental Hygienist",
    registrationNumber: "DH-104-MH",
    clinicId: 104,
    clinicName: "Sunshine Dental Care Pune",
    staffType: "hygienist",
    fixedSalary: 42000,
    totalPatientsThisMonth: 58,
    totalRevenueGenerated: 1740000
  },
  // Hyderabad - Clinic 105
  {
    doctorId: 11,
    doctorName: "Dr. Karthik Reddy",
    specialty: "Orthodontist",
    registrationNumber: "MCI-A-89012-TS",
    clinicId: 105,
    clinicName: "Bright Smiles Hyderabad",
    staffType: "doctor",
    fixedSalary: 148000,
    totalPatientsThisMonth: 37,
    totalRevenueGenerated: 7400000
  },
  // Chennai - Clinic 106
  {
    doctorId: 12,
    doctorName: "Dr. Lakshmi Krishnan",
    specialty: "Pediatric Dentist",
    registrationNumber: "MCI-A-90123-TN",
    clinicId: 106,
    clinicName: "Elite Dental Care Chennai",
    staffType: "doctor",
    fixedSalary: 142000,
    totalPatientsThisMonth: 44,
    totalRevenueGenerated: 6248000
  }
];

export default function SalaryManagement() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClinic, setSelectedClinic] = useState("all");
  const [selectedPeriod, setSelectedPeriod] = useState("current");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Edit salary modal state
  const [showEditSalaryModal, setShowEditSalaryModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [editSalaryForm, setEditSalaryForm] = useState({
    newSalary: "",
    effectiveDate: new Date().toISOString().split('T')[0],
    remarks: ""
  });

  // Filter doctors based on clinic and search term
  const filteredDoctors = useMemo(() => {
    let filtered = SAMPLE_DOCTORS;

    // Filter by clinic
    if (selectedClinic !== "all") {
      filtered = filtered.filter(doctor => doctor.clinicId === parseInt(selectedClinic));
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doctor => 
        doctor.doctorName.toLowerCase().includes(term) ||
        doctor.specialty.toLowerCase().includes(term) ||
        doctor.registrationNumber.toLowerCase().includes(term) ||
        doctor.clinicName.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [searchTerm, selectedClinic]);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handleDoctorClick = (doctor) => {
    navigate(`/salary/doctor/${doctor.doctorId}`, {
      state: { 
        doctor,
        month: selectedMonth,
        year: selectedYear
      }
    });
  };

  const totalDoctors = filteredDoctors.length;
  const totalRevenue = filteredDoctors.reduce((sum, d) => sum + d.totalRevenueGenerated, 0);
  const totalPatients = filteredDoctors.reduce((sum, d) => sum + d.totalPatientsThisMonth, 0);
  const totalFixedSalary = filteredDoctors.reduce((sum, d) => sum + d.fixedSalary, 0);

  const selectedClinicName = selectedClinic === "all" 
    ? "All Clinics" 
    : SAMPLE_CLINICS.find(c => c.clinicId === parseInt(selectedClinic))?.clinicName || "Unknown";

  const handleEditSalary = (e, doctor) => {
    e.stopPropagation();
    setSelectedStaff(doctor);
    setEditSalaryForm({
      newSalary: doctor.fixedSalary.toString(),
      effectiveDate: new Date().toISOString().split('T')[0],
      remarks: ""
    });
    setShowEditSalaryModal(true);
  };

  const handleSaveSalary = () => {
    if (!editSalaryForm.newSalary || parseFloat(editSalaryForm.newSalary) <= 0) {
      alert("Please enter a valid salary amount");
      return;
    }
    alert(`Salary updated for ${selectedStaff.doctorName}\nNew Salary: ₹${parseFloat(editSalaryForm.newSalary).toLocaleString('en-IN')}\nEffective Date: ${editSalaryForm.effectiveDate}\nRemarks: ${editSalaryForm.remarks || 'None'}`);
    setShowEditSalaryModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warmGray-50 to-teal-50/30 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent mb-2">
              💰 Salary Management
            </h1>
            <p className="text-slate-600">Calculate staff salaries with fixed components and patient-based incentives</p>
            {selectedClinic !== "all" && (
              <div className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-teal-100 border border-teal-300 rounded-lg">
                <span className="text-sm font-semibold text-teal-700">📍 {selectedClinicName}</span>
              </div>
            )}
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

        {/* Clinic and Period Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-teal-100 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                🏥 Select Clinic
              </label>
              <select
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-teal-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none bg-white font-semibold"
              >
                <option value="all">All Clinics</option>
                {SAMPLE_CLINICS.map(clinic => (
                  <option key={clinic.clinicId} value={clinic.clinicId}>
                    {clinic.clinicName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                📅 Period Type
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-teal-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none bg-white"
              >
                <option value="current">Current Month</option>
                <option value="previous">Previous Month</option>
                <option value="custom">Custom Period</option>
              </select>
            </div>

            {selectedPeriod === 'custom' && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Month
                  </label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border border-teal-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none bg-white"
                  >
                    {months.map((month, index) => (
                      <option key={index} value={index + 1}>{month}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Year
                  </label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border border-teal-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none bg-white"
                  >
                    {[2024, 2025, 2026].map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl shadow-lg p-6 border border-teal-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                👨‍⚕️
              </div>
            </div>
            <h3 className="text-sm font-semibold text-teal-600 mb-1">Total Staff</h3>
            <p className="text-3xl font-bold text-slate-800">{totalDoctors}</p>
            <p className="text-xs text-slate-500 mt-2">Active this period</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 rounded-xl shadow-lg p-6 border border-violet-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                💵
              </div>
            </div>
            <h3 className="text-sm font-semibold text-violet-600 mb-1">Total Fixed Salary</h3>
            <p className="text-3xl font-bold text-slate-800">₹{totalFixedSalary.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-500 mt-2">Base payroll amount</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border border-indigo-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                👥
              </div>
            </div>
            <h3 className="text-sm font-semibold text-indigo-600 mb-1">Total Patients Treated</h3>
            <p className="text-3xl font-bold text-slate-800">{totalPatients}</p>
            <p className="text-xs text-slate-500 mt-2">Across all staff</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-amber-50 via-gold-50 to-peach-50 rounded-xl shadow-lg p-6 border border-amber-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-gradient-to-br from-amber-500 to-gold-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                💰
              </div>
            </div>
            <h3 className="text-sm font-semibold text-amber-600 mb-1">Total Revenue Generated</h3>
            <p className="text-3xl font-bold text-slate-800">₹{totalRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-slate-500 mt-2">Before incentives</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Search Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-teal-100 mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              🔍 Search Staff
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type name, specialty, clinic, or registration number..."
              className="w-full px-4 py-3 rounded-lg border border-teal-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none text-lg"
            />
          </div>
          {searchTerm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSearchTerm("")}
              className="mt-7 px-4 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg font-semibold hover:shadow-md transition-all"
            >
              Clear
            </motion.button>
          )}
        </div>
        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-slate-500">
            {filteredDoctors.length} staff member{filteredDoctors.length !== 1 ? 's' : ''} found
            {selectedClinic !== "all" && ` in ${selectedClinicName}`}
          </p>
          {selectedClinic !== "all" && (
            <button
              onClick={() => setSelectedClinic("all")}
              className="text-sm text-teal-600 hover:text-teal-700 font-semibold underline"
            >
              View All Clinics
            </button>
          )}
        </div>
      </motion.div>

      {/* Doctor Tiles Grid */}
      <AnimatePresence mode="wait">
        {filteredDoctors.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center border border-slate-200"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Staff Found</h3>
            <p className="text-slate-500">
              {selectedClinic !== "all" 
                ? `No staff members found in ${selectedClinicName}` 
                : "Try a different search term or select a specific clinic"}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor, index) => (
              <motion.div
                key={doctor.doctorId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -4 }}
                onClick={() => handleDoctorClick(doctor)}
                className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 cursor-pointer hover:shadow-2xl transition-all"
              >
                {/* Staff Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {doctor.doctorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-800">{doctor.doctorName}</h3>
                    <p className="text-sm text-teal-600 font-semibold">{doctor.specialty}</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                      doctor.staffType === 'doctor' ? 'bg-violet-100 text-violet-700' :
                      doctor.staffType === 'dentist' ? 'bg-blue-100 text-blue-700' :
                      doctor.staffType === 'hygienist' ? 'bg-emerald-100 text-emerald-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {doctor.staffType.charAt(0).toUpperCase() + doctor.staffType.slice(1)}
                    </span>
                  </div>
                </div>

                {/* Clinic & Registration */}
                <div className="space-y-2 mb-4">
                  {selectedClinic === "all" && (
                    <div className="bg-teal-50 rounded-lg p-2 border border-teal-200">
                      <p className="text-xs text-teal-600 font-semibold flex items-center gap-1">
                        <span>🏥</span> {doctor.clinicName}
                      </p>
                    </div>
                  )}
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Registration No.</p>
                    <p className="text-sm font-mono font-semibold text-slate-700">{doctor.registrationNumber}</p>
                  </div>
                </div>

                {/* Statistics */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Fixed Salary</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-emerald-600">₹{doctor.fixedSalary.toLocaleString('en-IN')}</span>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleEditSalary(e, doctor)}
                        className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded transition-colors"
                        title="Edit Fixed Salary"
                      >
                        <span className="text-xs">✏️</span>
                      </motion.button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Patients Treated</span>
                    <span className="text-sm font-bold text-indigo-600">{doctor.totalPatientsThisMonth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Revenue Generated</span>
                    <span className="text-sm font-bold text-amber-600">₹{doctor.totalRevenueGenerated.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Action Button */}
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-4 pt-4 border-t border-slate-200"
                >
                  <div className="w-full px-4 py-2 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 text-white rounded-lg font-semibold text-center">
                    Calculate Salary →
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Edit Salary Modal */}
      <AnimatePresence>
        {showEditSalaryModal && selectedStaff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditSalaryModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Edit Fixed Salary</h2>
                  <p className="text-sm text-slate-600">Update salary for {selectedStaff.doctorName}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowEditSalaryModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ✕
                </motion.button>
              </div>

              {/* Current Salary Info */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Current Fixed Salary</p>
                    <p className="text-2xl font-bold text-slate-800">₹{selectedStaff.fixedSalary.toLocaleString('en-IN')}</p>
                    <p className="text-xs text-slate-500 mt-1">{selectedStaff.specialty} • {selectedStaff.clinicName}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
                    💰
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    New Monthly Fixed Salary (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={editSalaryForm.newSalary}
                    onChange={(e) => setEditSalaryForm({...editSalaryForm, newSalary: e.target.value})}
                    placeholder="Enter new salary amount"
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none text-lg"
                  />
                  {editSalaryForm.newSalary && (
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm text-emerald-600 font-semibold">
                        ₹{parseFloat(editSalaryForm.newSalary).toLocaleString('en-IN')} per month
                      </p>
                      {parseFloat(editSalaryForm.newSalary) !== selectedStaff.fixedSalary && (
                        <p className={`text-sm font-bold ${
                          parseFloat(editSalaryForm.newSalary) > selectedStaff.fixedSalary 
                            ? 'text-emerald-600' 
                            : 'text-red-600'
                        }`}>
                          {parseFloat(editSalaryForm.newSalary) > selectedStaff.fixedSalary ? '↑' : '↓'} 
                          {' '}₹{Math.abs(parseFloat(editSalaryForm.newSalary) - selectedStaff.fixedSalary).toLocaleString('en-IN')}
                          {' '}({((Math.abs(parseFloat(editSalaryForm.newSalary) - selectedStaff.fixedSalary) / selectedStaff.fixedSalary) * 100).toFixed(1)}%)
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Effective From Date *
                  </label>
                  <input
                    type="date"
                    value={editSalaryForm.effectiveDate}
                    onChange={(e) => setEditSalaryForm({...editSalaryForm, effectiveDate: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    New salary will be effective from this date. Previous salary will be recorded in history.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Remarks (Optional)
                  </label>
                  <textarea
                    value={editSalaryForm.remarks}
                    onChange={(e) => setEditSalaryForm({...editSalaryForm, remarks: e.target.value})}
                    placeholder="e.g., Annual increment, Promotion, Performance bonus..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEditSalaryModal(false)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveSalary}
                  disabled={!editSalaryForm.newSalary || parseFloat(editSalaryForm.newSalary) <= 0}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold shadow-lg transition-all ${
                    !editSalaryForm.newSalary || parseFloat(editSalaryForm.newSalary) <= 0
                      ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-xl'
                  }`}
                >
                  💾 Update Salary
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
