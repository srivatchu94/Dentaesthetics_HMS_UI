import React, { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useParams, useLocation } from "react-router-dom";

// Sample patient treatment records
const generateSampleTreatments = (doctorId) => {
  const patients = [
    { name: "Priya Sharma", treatments: ["Root Canal", "Crown"], amounts: [8300, 12450] },
    { name: "Arjun Patel", treatments: ["Teeth Whitening", "Scaling"], amounts: [4150, 2075] },
    { name: "Anjali Reddy", treatments: ["Dental Implant", "X-Ray"], amounts: [41500, 830] },
    { name: "Vikram Singh", treatments: ["Braces Adjustment"], amounts: [6225] },
    { name: "Kavya Menon", treatments: ["Tooth Extraction", "Filling"], amounts: [3320, 1660] },
    { name: "Rahul Verma", treatments: ["Cavity Filling", "Cleaning"], amounts: [2490, 1245] },
    { name: "Sneha Iyer", treatments: ["Veneers"], amounts: [24900] },
    { name: "Aditya Gupta", treatments: ["Gum Treatment"], amounts: [5810] },
    { name: "Meera Nair", treatments: ["Orthodontic Consultation", "Retainers"], amounts: [1660, 8300] },
    { name: "Karthik Reddy", treatments: ["Wisdom Tooth Removal"], amounts: [12450] }
  ];

  let recordId = 1;
  const records = [];

  patients.forEach((patient, pIndex) => {
    patient.treatments.forEach((treatment, tIndex) => {
      const amount = patient.amounts[tIndex];
      const paymentStatuses = ['paid', 'paid', 'paid', 'partial', 'pending'];
      const status = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      
      let paidAmount, pendingAmount;
      if (status === 'paid') {
        paidAmount = amount;
        pendingAmount = 0;
      } else if (status === 'partial') {
        paidAmount = Math.floor(amount * 0.6);
        pendingAmount = amount - paidAmount;
      } else {
        paidAmount = 0;
        pendingAmount = amount;
      }

      records.push({
        recordId: recordId++,
        patientId: 100 + pIndex,
        patientName: patient.name,
        treatmentDate: `2025-11-${String(Math.floor(Math.random() * 18) + 1).padStart(2, '0')}`,
        treatmentType: treatment,
        treatmentAmount: amount,
        paymentStatus: status,
        paidAmount,
        pendingAmount,
        incentivePercent: 0,
        incentiveAmount: 0
      });
    });
  });

  return records;
};

export default function DoctorSalaryDetails() {
  const navigate = useNavigate();
  const { doctorId } = useParams();
  const location = useLocation();
  const { doctor, month, year } = location.state || {};

  const [treatmentRecords, setTreatmentRecords] = useState(() => 
    generateSampleTreatments(doctorId)
  );
  const [globalIncentive, setGlobalIncentive] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Apply global incentive to all records
  const applyGlobalIncentive = () => {
    const percent = parseFloat(globalIncentive);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      alert("Please enter a valid incentive percentage (0-100)");
      return;
    }

    setTreatmentRecords(prev => prev.map(record => ({
      ...record,
      incentivePercent: percent,
      incentiveAmount: (record.paidAmount * percent) / 100
    })));
  };

  // Update individual record incentive
  const updateRecordIncentive = (recordId, value) => {
    const percent = parseFloat(value);
    if (isNaN(percent)) return;

    setTreatmentRecords(prev => prev.map(record => 
      record.recordId === recordId
        ? {
            ...record,
            incentivePercent: percent,
            incentiveAmount: (record.paidAmount * percent) / 100
          }
        : record
    ));
  };

  // Filter records
  const filteredRecords = useMemo(() => {
    if (filterStatus === "all") return treatmentRecords;
    return treatmentRecords.filter(r => r.paymentStatus === filterStatus);
  }, [treatmentRecords, filterStatus]);

  // Calculate totals
  const calculations = useMemo(() => {
    const totalTreatmentAmount = filteredRecords.reduce((sum, r) => sum + r.treatmentAmount, 0);
    const totalPaidAmount = filteredRecords.reduce((sum, r) => sum + r.paidAmount, 0);
    const totalPendingAmount = filteredRecords.reduce((sum, r) => sum + r.pendingAmount, 0);
    const totalIncentives = filteredRecords.reduce((sum, r) => sum + (r.incentiveAmount || 0), 0);
    const grandTotal = (doctor?.fixedSalary || 0) + totalIncentives;

    return {
      totalTreatmentAmount,
      totalPaidAmount,
      totalPendingAmount,
      totalIncentives,
      grandTotal
    };
  }, [filteredRecords, doctor]);

  const getStatusBadge = (status) => {
    const styles = {
      paid: "bg-emerald-100 text-emerald-700 border-emerald-200",
      pending: "bg-red-100 text-red-700 border-red-200",
      partial: "bg-amber-100 text-amber-700 border-amber-200"
    };
    const labels = {
      paid: "✓ Paid",
      pending: "⏳ Pending",
      partial: "⚠ Partial"
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warmGray-50 to-teal-50/30 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-slate-700 mb-2">No Doctor Data</h2>
          <p className="text-slate-500 mb-4">Please select a doctor from the salary management page</p>
          <button
            onClick={() => navigate("/salary")}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Go to Salary Management
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream-50 via-warmGray-50 to-teal-50/30 p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {doctor.doctorName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
                {doctor.doctorName}
              </h1>
              <p className="text-slate-600">{doctor.specialty} • {doctor.registrationNumber}</p>
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/salary")}
            className="px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
          >
            ← Back to List
          </motion.button>
        </div>

        {/* Fixed Salary Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-xl shadow-lg p-6 border border-teal-200 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-teal-700 mb-2">💼 Fixed Monthly Salary</h3>
              <p className="text-4xl font-bold text-slate-800">₹{doctor.fixedSalary.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Period</p>
              <p className="text-lg font-semibold text-slate-800">
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month - 1]} {year}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Global Incentive Control */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-amber-200 mb-6"
      >
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              🎯 Apply Incentive to All Treatments (%)
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={globalIncentive}
                onChange={(e) => setGlobalIncentive(e.target.value)}
                placeholder="Enter percentage (e.g., 3 for 3%)"
                className="flex-1 px-4 py-3 rounded-lg border border-amber-200 focus:ring-2 focus:ring-amber-400 focus:border-transparent outline-none text-lg"
              />
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={applyGlobalIncentive}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-gold-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
              >
                Apply to All
              </motion.button>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setGlobalIncentive("2"); applyGlobalIncentive(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-all text-sm"
            >
              2%
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setGlobalIncentive("3"); applyGlobalIncentive(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-all text-sm"
            >
              3%
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { setGlobalIncentive("5"); applyGlobalIncentive(); }}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition-all text-sm"
            >
              5%
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Filter Buttons */}
      <div className="flex gap-3 mb-6">
        {['all', 'paid', 'partial', 'pending'].map(status => (
          <motion.button
            key={status}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setFilterStatus(status)}
            className={`px-5 py-2 rounded-lg font-semibold transition-all ${
              filterStatus === status
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)} ({
              status === 'all' 
                ? treatmentRecords.length 
                : treatmentRecords.filter(r => r.paymentStatus === status).length
            })
          </motion.button>
        ))}
      </div>

      {/* Treatment Records Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 overflow-hidden mb-6"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white">
              <tr>
                <th className="px-4 py-4 text-left text-sm font-bold">Date</th>
                <th className="px-4 py-4 text-left text-sm font-bold">Patient Name</th>
                <th className="px-4 py-4 text-left text-sm font-bold">Treatment</th>
                <th className="px-4 py-4 text-right text-sm font-bold">Amount</th>
                <th className="px-4 py-4 text-center text-sm font-bold">Status</th>
                <th className="px-4 py-4 text-right text-sm font-bold">Paid</th>
                <th className="px-4 py-4 text-right text-sm font-bold">Pending</th>
                <th className="px-4 py-4 text-center text-sm font-bold">Incentive %</th>
                <th className="px-4 py-4 text-right text-sm font-bold">Incentive ₹</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((record, index) => (
                <motion.tr
                  key={record.recordId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.02 }}
                  className="border-b border-slate-100 hover:bg-teal-50/50 transition-colors"
                >
                  <td className="px-4 py-4 text-sm text-slate-600">{record.treatmentDate}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-800">{record.patientName}</td>
                  <td className="px-4 py-4 text-sm text-slate-700">{record.treatmentType}</td>
                  <td className="px-4 py-4 text-sm text-right font-semibold text-slate-800">
                    ₹{record.treatmentAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-4 text-center">{getStatusBadge(record.paymentStatus)}</td>
                  <td className="px-4 py-4 text-sm text-right font-semibold text-emerald-600">
                    ₹{record.paidAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-semibold text-red-600">
                    ₹{record.pendingAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={record.incentivePercent || ''}
                      onChange={(e) => updateRecordIncentive(record.recordId, e.target.value)}
                      className="w-20 px-2 py-1 text-center border border-slate-300 rounded focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                    />
                  </td>
                  <td className="px-4 py-4 text-sm text-right font-bold text-amber-600">
                    ₹{(record.incentiveAmount || 0).toLocaleString('en-IN')}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Grand Total Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-amber-50 via-gold-50 to-peach-50 rounded-xl shadow-xl p-8 border-2 border-amber-300"
      >
        <h2 className="text-2xl font-bold text-amber-900 mb-6 flex items-center gap-2">
          <span className="text-3xl">💰</span>
          Salary Summary
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/70 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Total Treatment Amount</p>
            <p className="text-2xl font-bold text-slate-800">₹{calculations.totalTreatmentAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white/70 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Total Paid Amount</p>
            <p className="text-2xl font-bold text-emerald-600">₹{calculations.totalPaidAmount.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-white/70 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Total Pending Amount</p>
            <p className="text-2xl font-bold text-red-600">₹{calculations.totalPendingAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>

        <div className="border-t-2 border-amber-300 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-slate-700">Fixed Salary</span>
            <span className="text-2xl font-bold text-slate-800">₹{doctor.fixedSalary.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-slate-700">Total Incentives</span>
            <span className="text-2xl font-bold text-amber-600">+ ₹{calculations.totalIncentives.toLocaleString('en-IN')}</span>
          </div>
          <div className="border-t-2 border-amber-400 pt-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-amber-900">GRAND TOTAL</span>
              <span className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-gold-600 bg-clip-text text-transparent">
                ₹{calculations.grandTotal.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            💾 Save Calculation
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all"
          >
            📥 Generate Salary Slip
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
