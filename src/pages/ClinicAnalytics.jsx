import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Sample data - replace with actual API calls
const generateRevenueData = (period) => {
  const baseRevenue = 15000;
  const basePatients = 120;
  
  switch(period) {
    case 'week':
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        revenue: [174300, 199200, 182600, 232400, 257300, 149400, 74700],
        patients: [18, 22, 20, 25, 28, 16, 8]
      };
    case 'month':
      return {
        labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
        revenue: [705500, 763600, 730400, 788500],
        patients: [85, 92, 88, 95]
      };
    case 'quarter':
      return {
        labels: ['Month 1', 'Month 2', 'Month 3'],
        revenue: [2988000, 3195500, 3419600],
        patients: [360, 385, 412]
      };
    case 'year':
      return {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        revenue: [3486000, 3154000, 3735000, 3569000, 3984000, 3818000, 4150000, 4067000, 4316000, 4233000, 4482000, 4648000],
        patients: [420, 380, 450, 430, 480, 460, 500, 490, 520, 510, 540, 560]
      };
    default:
      return { labels: [], revenue: [], patients: [] };
  }
};

const SAMPLE_CLINICS = [
  {
    clinicId: 101,
    clinicName: "Dentaesthetics Mumbai Central",
    city: "Mumbai",
    monthlyRevenue: 3750000,
    monthlyPatients: 420,
    yearlyRevenue: 47600000,
    yearlyPatients: 5240,
    avgRevenuePerPatient: 9085
  },
  {
    clinicId: 102,
    clinicName: "Smile Care Bangalore",
    city: "Bangalore",
    monthlyRevenue: 3190000,
    monthlyPatients: 350,
    yearlyRevenue: 38280000,
    yearlyPatients: 4200,
    avgRevenuePerPatient: 9115
  },
  {
    clinicId: 103,
    clinicName: "Pearl Dental Clinic Delhi",
    city: "Delhi",
    monthlyRevenue: 5140000,
    monthlyPatients: 380,
    yearlyRevenue: 61680000,
    yearlyPatients: 4560,
    avgRevenuePerPatient: 13526
  }
];

export default function ClinicAnalytics() {
  const navigate = useNavigate();
  const [selectedClinic, setSelectedClinic] = useState(SAMPLE_CLINICS[0]);
  const [timePeriod, setTimePeriod] = useState('month');
  const [showComparison, setShowComparison] = useState(false);

  const chartData = useMemo(() => generateRevenueData(timePeriod), [timePeriod]);

  // Calculate statistics
  const totalRevenue = chartData.revenue.reduce((a, b) => a + b, 0);
  const totalPatients = chartData.patients.reduce((a, b) => a + b, 0);
  const avgRevenuePerPeriod = totalRevenue / chartData.revenue.length;
  const avgPatientsPerPeriod = totalPatients / chartData.patients.length;
  const revenueGrowth = ((chartData.revenue[chartData.revenue.length - 1] - chartData.revenue[0]) / chartData.revenue[0] * 100).toFixed(1);
  const patientGrowth = ((chartData.patients[chartData.patients.length - 1] - chartData.patients[0]) / chartData.patients[0] * 100).toFixed(1);

  // Chart rendering
  const maxRevenue = Math.max(...chartData.revenue);
  const maxPatients = Math.max(...chartData.patients);

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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-700 via-sage-700 to-coral-700 bg-clip-text text-transparent mb-2">
              Clinic Analytics & Revenue
            </h1>
            <p className="text-slate-600">Track revenue, patient flow, and performance metrics</p>
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

        {/* Clinic Selector and Period Selector */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-teal-100">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Clinic Selector */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Select Clinic
              </label>
              <select
                value={selectedClinic.clinicId}
                onChange={(e) => setSelectedClinic(SAMPLE_CLINICS.find(c => c.clinicId === parseInt(e.target.value)))}
                className="w-full px-4 py-3 rounded-lg border border-teal-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none bg-white"
              >
                {SAMPLE_CLINICS.map(clinic => (
                  <option key={clinic.clinicId} value={clinic.clinicId}>
                    {clinic.clinicName} - {clinic.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Time Period Selector */}
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Time Period
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                  { value: 'quarter', label: 'Quarter' },
                  { value: 'year', label: 'Year' }
                ].map(period => (
                  <motion.button
                    key={period.value}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setTimePeriod(period.value)}
                    className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                      timePeriod === period.value
                        ? 'bg-gradient-to-r from-teal-500 to-sage-500 text-white shadow-lg'
                        : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 hover:from-slate-200 hover:to-slate-300'
                    }`}
                  >
                    {period.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-50 via-teal-50 to-sage-50 rounded-xl shadow-lg p-6 border border-teal-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
              💰
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              revenueGrowth >= 0 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueGrowth)}%
            </div>
          </div>
          <h3 className="text-sm font-semibold text-teal-600 mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-slate-800">₹{totalRevenue.toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-500 mt-2">Avg: ₹{avgRevenuePerPeriod.toFixed(0)}/period</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl shadow-lg p-6 border border-indigo-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
              👥
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              patientGrowth >= 0 
                ? 'bg-blue-100 text-blue-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {patientGrowth >= 0 ? '↑' : '↓'} {Math.abs(patientGrowth)}%
            </div>
          </div>
          <h3 className="text-sm font-semibold text-indigo-600 mb-1">Total Patients</h3>
          <p className="text-3xl font-bold text-slate-800">{totalPatients}</p>
          <p className="text-xs text-slate-500 mt-2">Avg: {avgPatientsPerPeriod.toFixed(0)}/period</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-coral-50 via-peach-50 to-gold-50 rounded-xl shadow-lg p-6 border border-coral-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-coral-500 to-peach-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
              📊
            </div>
          </div>
          <h3 className="text-sm font-semibold text-coral-600 mb-1">Avg Revenue/Patient</h3>
          <p className="text-3xl font-bold text-slate-800">₹{(totalRevenue / totalPatients).toFixed(0)}</p>
          <p className="text-xs text-slate-500 mt-2">Per visit average</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-amber-50 via-gold-50 to-peach-50 rounded-xl shadow-lg p-6 border border-amber-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="bg-gradient-to-br from-amber-500 to-gold-600 text-white w-12 h-12 rounded-lg flex items-center justify-center text-2xl">
              📈
            </div>
          </div>
          <h3 className="text-sm font-semibold text-amber-600 mb-1">Peak Period</h3>
          <p className="text-3xl font-bold text-slate-800">
            {chartData.labels[chartData.revenue.indexOf(maxRevenue)]}
          </p>
          <p className="text-xs text-slate-500 mt-2">₹{maxRevenue.toLocaleString('en-IN')} revenue</p>
        </motion.div>
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-teal-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Revenue Trend
            </h3>
            <div className="text-sm text-slate-500">Period: {timePeriod}</div>
          </div>
          
          <div className="relative h-80">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-slate-500">
              <span>₹{(maxRevenue * 1.1).toFixed(0)}</span>
              <span>₹{(maxRevenue * 0.75).toFixed(0)}</span>
              <span>₹{(maxRevenue * 0.5).toFixed(0)}</span>
              <span>₹{(maxRevenue * 0.25).toFixed(0)}</span>
              <span>₹0</span>
            </div>

            {/* Chart area */}
            <div className="absolute left-16 right-0 top-0 bottom-8 border-l-2 border-b-2 border-slate-200">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(percent => (
                <div
                  key={percent}
                  className="absolute left-0 right-0 border-t border-slate-100"
                  style={{ bottom: `${percent}%` }}
                />
              ))}

              {/* Bars */}
              <div className="absolute inset-0 flex items-end justify-around px-2">
                {chartData.revenue.map((value, index) => {
                  const height = (value / (maxRevenue * 1.1)) * 100;
                  return (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                      className="relative flex-1 mx-1 group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500 via-teal-500 to-sage-400 rounded-t-lg shadow-lg hover:shadow-xl transition-shadow">
                        {/* Tooltip */}
                        <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-3 py-2 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          ₹{value.toLocaleString('en-IN')}
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-slate-800"></div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="absolute left-16 right-0 bottom-0 h-8 flex items-center justify-around text-xs text-slate-600 font-medium">
              {chartData.labels.map((label, index) => (
                <span key={index} className="flex-1 text-center">{label}</span>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Patient Flow Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-indigo-100"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              Patient Flow
            </h3>
            <div className="text-sm text-slate-500">Period: {timePeriod}</div>
          </div>
          
          <div className="relative h-80">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-slate-500">
              <span>{Math.ceil(maxPatients * 1.1)}</span>
              <span>{Math.ceil(maxPatients * 0.75)}</span>
              <span>{Math.ceil(maxPatients * 0.5)}</span>
              <span>{Math.ceil(maxPatients * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Chart area */}
            <div className="absolute left-16 right-0 top-0 bottom-8 border-l-2 border-b-2 border-slate-200">
              {/* Grid lines */}
              {[0, 25, 50, 75, 100].map(percent => (
                <div
                  key={percent}
                  className="absolute left-0 right-0 border-t border-slate-100"
                  style={{ bottom: `${percent}%` }}
                />
              ))}

              {/* Line chart */}
              <svg className="absolute inset-0 overflow-visible">
                <defs>
                  <linearGradient id="patientGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                
                {/* Area fill */}
                <motion.path
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.6, duration: 1 }}
                  d={`M 0 ${100 - (chartData.patients[0] / (maxPatients * 1.1) * 100)}% ${chartData.patients.map((value, index) => {
                    const x = ((index + 1) / (chartData.patients.length + 1)) * 100;
                    const y = 100 - (value / (maxPatients * 1.1) * 100);
                    return `L ${x}% ${y}%`;
                  }).join(' ')} L 100% 100% L 0 100% Z`}
                  fill="url(#patientGradient)"
                />
                
                {/* Line */}
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.6, duration: 1 }}
                  d={`M 0 ${100 - (chartData.patients[0] / (maxPatients * 1.1) * 100)}% ${chartData.patients.map((value, index) => {
                    const x = ((index + 1) / (chartData.patients.length + 1)) * 100;
                    const y = 100 - (value / (maxPatients * 1.1) * 100);
                    return `L ${x}% ${y}%`;
                  }).join(' ')}`}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                
                <defs>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                    <stop offset="100%" stopColor="rgb(99, 102, 241)" />
                  </linearGradient>
                </defs>

                {/* Data points */}
                {chartData.patients.map((value, index) => {
                  const x = ((index + 1) / (chartData.patients.length + 1)) * 100;
                  const y = 100 - (value / (maxPatients * 1.1) * 100);
                  return (
                    <g key={index}>
                      <motion.circle
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.7 + index * 0.05 }}
                        cx={`${x}%`}
                        cy={`${y}%`}
                        r="6"
                        fill="white"
                        stroke="rgb(99, 102, 241)"
                        strokeWidth="3"
                        className="hover:r-8 transition-all cursor-pointer"
                      />
                      <title>{value} patients</title>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* X-axis labels */}
            <div className="absolute left-16 right-0 bottom-0 h-8 flex items-center justify-around text-xs text-slate-600 font-medium">
              {chartData.labels.map((label, index) => (
                <span key={index} className="flex-1 text-center">{label}</span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Clinic Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden border border-coral-100"
      >
        <div className="bg-gradient-to-r from-coral-50 via-peach-50 to-gold-50 px-6 py-4 border-b border-coral-200">
          <h3 className="text-xl font-bold bg-gradient-to-r from-coral-700 to-gold-700 bg-clip-text text-transparent">
            All Clinics Comparison
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-slate-50 to-warmGray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Clinic</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Monthly Revenue</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Monthly Patients</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Yearly Revenue</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Yearly Patients</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Avg/Patient</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {SAMPLE_CLINICS.map((clinic, index) => (
                <motion.tr
                  key={clinic.clinicId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  className={`hover:bg-gradient-to-r hover:from-teal-50 hover:to-sage-50 transition-all ${
                    selectedClinic.clinicId === clinic.clinicId ? 'bg-gradient-to-r from-coral-50 to-peach-50' : ''
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{clinic.clinicName}</div>
                    <div className="text-sm text-slate-500">{clinic.city}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-emerald-600">₹{clinic.monthlyRevenue.toLocaleString('en-IN')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-indigo-600">{clinic.monthlyPatients}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-teal-600">₹{clinic.yearlyRevenue.toLocaleString('en-IN')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-blue-600">{clinic.yearlyPatients}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-coral-600">₹{clinic.avgRevenuePerPatient.toLocaleString('en-IN')}</div>
                  </td>
                  <td className="px-6 py-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedClinic(clinic)}
                      className="px-4 py-2 bg-gradient-to-r from-teal-500 to-sage-500 text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all"
                    >
                      View Details
                    </motion.button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
