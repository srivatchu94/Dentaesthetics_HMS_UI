import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://cliniassistsapi-cmb3dcceapfwa6ah.centralus-01.azurewebsites.net/api";

export default function DoctorSalaryDetails() {
  const { doctorId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const doctor = location.state?.doctor;

  const [salaryDetails, setSalaryDetails] = useState(null);
  const [salaryDetailsLoading, setSalaryDetailsLoading] = useState(false);
  const [salaryDetailsError, setSalaryDetailsError] = useState("");
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [appointmentRecords, setAppointmentRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState("");
  const [applyAllPercentage, setApplyAllPercentage] = useState("");
  const [incentivePercentages, setIncentivePercentages] = useState({});
  
  // Normalize salary structure data from API
  const normalizeSalaryDetails = (data) => {
    if (!data) return null;
    // API returns array, take first element
    const salaryStructure = Array.isArray(data) ? data[0] : data;
    return {
      salaryStructureID: salaryStructure.salaryStructureID,
      doctorID: salaryStructure.doctorID,
      fixedSalary: salaryStructure.basicPay,
      effectiveDate: salaryStructure.effectiveFrom,
      endDate: salaryStructure.effectiveTo,
      commissionType: salaryStructure.commissionType,
      commissionRate: salaryStructure.commissionRate,
      maxCommissionCap: salaryStructure.maxCommissionCap,
      bonusEligibility: salaryStructure.bonusEligibility,
      isActive: salaryStructure.isActive,
      createdBy: salaryStructure.createdBy,
      createdDate: salaryStructure.createdDate,
      modifiedBy: salaryStructure.modifiedBy,
      modifiedDate: salaryStructure.modifiedDate
    };
  };

  useEffect(() => {
    if (!doctor || !doctorId) {
      setSalaryDetailsError("Doctor information not found");
      return;
    }

    const loadSalaryDetails = async () => {
      setSalaryDetailsLoading(true);
      setSalaryDetailsError("");
      try {
        const response = await fetch(`${API_BASE_URL}/DoctorProfile/salary-structures/${doctorId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log("✅ Salary structure loaded:", data);
          const normalizedData = normalizeSalaryDetails(data);
          setSalaryDetails(normalizedData);
        } else {
          setSalaryDetailsError("Failed to fetch salary details. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching salary details:", error);
        setSalaryDetailsError("Error fetching salary details: " + error.message);
      } finally {
        setSalaryDetailsLoading(false);
      }
    };

    loadSalaryDetails();
  }, [doctorId, doctor]);

  const handleLoadAppointments = async () => {
    if (!dateFrom || !dateTo) {
      setRecordsError("⚠️ Please select both from and to dates");
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      setRecordsError("⚠️ From date cannot be later than to date");
      return;
    }

    setRecordsLoading(true);
    setRecordsError("");

    try {
      const fromDateStr = new Date(dateFrom).toISOString().split('T')[0];
      const toDateStr = new Date(dateTo).toISOString().split('T')[0];

      console.log("📡 Fetching appointments for doctor", doctorId, "from", fromDateStr, "to", toDateStr);
      const response = await fetch(`${API_BASE_URL}/DoctorProfile/salary-calculation/${doctorId}?fromDate=${fromDateStr}&toDate=${toDateStr}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log("✅ Appointment records loaded:", data);
        
        // Handle nested appointments array from the API response
        const appointments = data.appointments || (Array.isArray(data) ? data : []);
        setAppointmentRecords(appointments);
        setIncentivePercentages({});
        
        if (appointments.length === 0) {
          setRecordsError("ℹ️ No appointments found for the selected date range");
        }
      } else {
        setRecordsError("Failed to fetch appointment records. Please try again.");
        setAppointmentRecords([]);
      }
    } catch (error) {
      console.error("Error fetching records:", error);
      setRecordsError("Error fetching records: " + error.message);
      setAppointmentRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };

  const handleApplyAllPercentage = () => {
    if (!applyAllPercentage || isNaN(applyAllPercentage)) {
      alert("Please enter a valid percentage");
      return;
    }
    const newPercentages = {};
    appointmentRecords.forEach((record) => {
      newPercentages[record.appointmentId] = parseFloat(applyAllPercentage);
    });
    setIncentivePercentages(newPercentages);
  };

  const handlePercentageChange = (appointmentId, value) => {
    setIncentivePercentages({
      ...incentivePercentages,
      [appointmentId]: value ? parseFloat(value) : 0
    });
  };

  // Calculate incentive amount based on paid amount and percentage
  const calculateIncentive = (paidAmount, percentage) => {
    if (!percentage || isNaN(percentage)) return 0;
    return (paidAmount * percentage) / 100;
  };

  // Summary calculations
  const summaryData = useMemo(() => {
    const fixedSalary = salaryDetails?.fixedSalary || 0;
    const totalIncentive = appointmentRecords.reduce((total, record) => {
      const percentage = incentivePercentages[record.appointmentId] || 0;
      const incentive = calculateIncentive(record.paidAmount, percentage);
      return total + incentive;
    }, 0);
    const grandTotal = fixedSalary + totalIncentive;

    return { fixedSalary, totalIncentive, grandTotal };
  }, [salaryDetails, appointmentRecords, incentivePercentages]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50/30 p-6">
      {/* Header */}
      <motion.div initial={{opacity:0,y:-20}} animate={{opacity:1,y:0}} className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 bg-clip-text text-transparent mb-2">
              💰 {doctor?.firstName} {doctor?.lastName} - Salary Calculation
            </h1>
            <p className="text-slate-600">Calculate incentives and generate payslips</p>
          </div>
          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={() => navigate(-1)} className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all">← Back</motion.button>
        </div>
      </motion.div>

      {/* Salary Structure Card */}
      {salaryDetailsLoading ? (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-white rounded-xl shadow-lg p-16 text-center"><motion.div animate={{rotate:360}} transition={{duration:2,repeat:Infinity,ease:"linear"}} className="w-16 h-16 border-4 border-indigo-300 border-t-indigo-600 rounded-full mx-auto" /><p className="text-slate-600 font-semibold mt-4">Loading salary details...</p></motion.div>
      ) : salaryDetailsError ? (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="bg-red-50 border-2 border-red-300 rounded-xl p-8 text-red-700 font-semibold mb-8">⚠️ {salaryDetailsError}</motion.div>
      ) : salaryDetails ? (
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white rounded-xl shadow-lg p-8 border-2 border-slate-100 mb-8">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3"><span>💼</span> Current Salary Structure</h2>
          
          {/* Main Salary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-6 border-2 border-emerald-300">
              <p className="text-xs text-slate-700 font-bold mb-2 uppercase tracking-wide">💰 Fixed Monthly Salary</p>
              <p className="text-4xl font-black text-emerald-700 mb-2">₹{(salaryDetails.fixedSalary || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-slate-600">Basic Pay</p>
            </motion.div>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.2}} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border-2 border-blue-300">
              <p className="text-xs text-slate-700 font-bold mb-2 uppercase tracking-wide">📅 Effective From</p>
              <p className="text-2xl font-bold text-blue-700 mb-2">{salaryDetails.effectiveDate ? new Date(salaryDetails.effectiveDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'}) : 'N/A'}</p>
              <p className="text-xs text-slate-600">Start date</p>
            </motion.div>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}} className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border-2 border-amber-300">
              <p className="text-xs text-slate-700 font-bold mb-2 uppercase tracking-wide">📍 Effective To</p>
              <p className="text-2xl font-bold text-amber-700 mb-2">{salaryDetails.endDate ? new Date(salaryDetails.endDate).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'2-digit'}) : '∞ Ongoing'}</p>
              <p className="text-xs text-slate-600">End date or ongoing</p>
            </motion.div>
          </div>

          {/* Commission & Incentive Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-6 border-2 border-indigo-200">
            <div className="bg-white rounded-lg p-4 border border-indigo-200 shadow-sm">
              <p className="text-xs text-slate-600 font-bold mb-2 uppercase tracking-wide">Commission Type</p>
              <p className="text-lg font-bold text-indigo-700">{salaryDetails.commissionType || 'N/A'}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-purple-200 shadow-sm">
              <p className="text-xs text-slate-600 font-bold mb-2 uppercase tracking-wide">Commission Rate</p>
              <p className="text-lg font-bold text-purple-700">{salaryDetails.commissionRate || 0}%</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-pink-200 shadow-sm">
              <p className="text-xs text-slate-600 font-bold mb-2 uppercase tracking-wide">Max Commission Cap</p>
              <p className="text-lg font-bold text-pink-700">₹{(salaryDetails.maxCommissionCap || 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="bg-white rounded-lg p-4 border border-green-200 shadow-sm">
              <p className="text-xs text-slate-600 font-bold mb-2 uppercase tracking-wide">Bonus Eligible</p>
              <p className="text-lg font-bold text-green-700">{salaryDetails.bonusEligibility ? '✓ Yes' : '✗ No'}</p>
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Date Range and Load Records Section */}
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="bg-white rounded-xl shadow-lg p-8 border-2 border-slate-100 mb-8">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3"><span>📅</span> Select Date Range</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div><label className="block text-sm font-semibold text-slate-700 mb-2">From Date</label><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-4 py-3 rounded-lg border-2 border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none font-semibold" /></div>
          <div><label className="block text-sm font-semibold text-slate-700 mb-2">To Date</label><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-4 py-3 rounded-lg border-2 border-indigo-200 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none font-semibold" /></div>
          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} onClick={handleLoadAppointments} disabled={recordsLoading} className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50">{recordsLoading ? "⏳ Loading..." : "🔍 Load Records"}</motion.button>
          <div className="flex items-center justify-center gap-2">{appointmentRecords.length > 0 && <span className="inline-flex items-center gap-2 px-4 py-3 bg-emerald-100 border-2 border-emerald-400 rounded-lg shadow-md font-bold text-emerald-700"><span>✓</span> {appointmentRecords.length} Record{appointmentRecords.length !== 1 ? 's' : ''}</span>}</div>
        </div>
        {recordsError && <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="mt-4 bg-red-50 border-2 border-red-300 rounded-lg p-4 text-red-700 font-semibold">{recordsError}</motion.div>}
      </motion.div>

      {/* Appointments Table Section */}
      <AnimatePresence>
        {appointmentRecords.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Apply All Percentage Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-xl shadow-lg p-6 border-2 border-purple-300"
            >
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-white mb-3">Apply Incentive Percentage to All Appointments</label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.5"
                      placeholder="Enter percentage (0-100)"
                      value={applyAllPercentage}
                      onChange={(e) => setApplyAllPercentage(e.target.value)}
                      className="flex-1 px-6 py-3 rounded-lg border-2 border-white bg-white/20 text-white placeholder-white/70 font-semibold focus:ring-2 focus:ring-white focus:border-transparent outline-none"
                    />
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleApplyAllPercentage}
                      className="px-8 py-3 bg-white hover:bg-slate-100 text-purple-600 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                    >
                      Apply to All
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Appointments Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-8 border-2 border-slate-100 overflow-x-auto"
            >
              <h3 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3"><span>📊</span> Appointment Records & Incentive Calculation</h3>
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
                    <th className="px-4 py-4 text-left font-bold text-sm">ID</th>
                    <th className="px-4 py-4 text-left font-bold text-sm">Patient Name</th>
                    <th className="px-4 py-4 text-left font-bold text-sm">Date</th>
                    <th className="px-4 py-4 text-right font-bold text-sm">Paid Amount</th>
                    <th className="px-4 py-4 text-right font-bold text-sm">Pending Amount</th>
                    <th className="px-4 py-4 text-right font-bold text-sm">Total Amount</th>
                    <th className="px-4 py-4 text-center font-bold text-sm">Incentive %</th>
                    <th className="px-4 py-4 text-right font-bold text-sm">Incentive Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {appointmentRecords.map((record, idx) => {
                    const incentivePercentage = incentivePercentages[record.appointmentId] || 0;
                    const incentiveAmount = calculateIncentive(record.paidAmount, incentivePercentage);
                    const totalAmount = (record.paidAmount || 0) + (record.pendingAmount || 0);

                    return (
                      <motion.tr
                        key={record.appointmentId || idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-indigo-50 transition-colors`}
                      >
                        <td className="px-4 py-4 font-semibold text-slate-800 text-sm">{record.appointmentId}</td>
                        <td className="px-4 py-4 font-semibold text-slate-800 text-sm">{record.patientFirstName} {record.patientLastName}</td>
                        <td className="px-4 py-4 text-slate-700 text-sm">{new Date(record.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                        <td className="px-4 py-4 text-right font-bold text-green-600 text-sm">₹{(record.paidAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-right font-bold text-red-600 text-sm">₹{(record.pendingAmount || 0).toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-right font-bold text-slate-800 text-sm">₹{totalAmount.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-4 text-center">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            value={incentivePercentage}
                            onChange={(e) => handlePercentageChange(record.appointmentId, e.target.value)}
                            placeholder="0"
                            className="w-20 px-3 py-2 text-center border-2 border-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none font-bold text-sm"
                          />
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="font-bold text-purple-600 text-sm">
                            ₹{incentiveAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>

            {/* Summary Panel */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              {/* Fixed Salary Card */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg p-8 border-2 border-emerald-400 text-white"
              >
                <p className="text-sm font-bold mb-2 uppercase tracking-wide opacity-90">Fixed Monthly Salary</p>
                <p className="text-4xl font-black mb-2">₹{summaryData.fixedSalary.toLocaleString('en-IN')}</p>
                <p className="text-xs opacity-80">Base salary component</p>
              </motion.div>

              {/* Total Incentive Card */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg p-8 border-2 border-violet-400 text-white"
              >
                <p className="text-sm font-bold mb-2 uppercase tracking-wide opacity-90">Total Incentive</p>
                <p className="text-4xl font-black mb-2">₹{summaryData.totalIncentive.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs opacity-80">Performance-based incentives</p>
              </motion.div>

              {/* Grand Total Card */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl shadow-lg p-8 border-2 border-pink-400 text-white"
              >
                <p className="text-sm font-bold mb-2 uppercase tracking-wide opacity-90">Grand Total</p>
                <p className="text-4xl font-black mb-2">₹{summaryData.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p className="text-xs opacity-80">Total compensation</p>
              </motion.div>
            </motion.div>

            {/* Payslip Generation Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-xl shadow-lg p-8 border-2 border-blue-300"
            >
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-white">
                  <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                    <span>📄</span> Generate Payslip
                  </h3>
                  <p className="text-blue-100 text-sm">Create and download a detailed payslip for {doctor?.firstName} {doctor?.lastName}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-white hover:bg-slate-100 text-indigo-600 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
                >
                  🖨️ Generate Payslip
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {appointmentRecords.length === 0 && !recordsLoading && !recordsError && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-50 rounded-lg p-16 text-center border-2 border-dashed border-slate-300"
        >
          <motion.p
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="text-6xl mb-4"
          >
            📅
          </motion.p>
          <p className="text-xl text-slate-700 font-bold mb-2">Load Appointment Records</p>
          <p className="text-slate-500">Select a date range and click "Load Records" to view and calculate incentives</p>
        </motion.div>
      )}
    </div>
  );
}