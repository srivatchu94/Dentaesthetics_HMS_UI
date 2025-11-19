import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

// Sample data for revenue analytics
const generateRevenueData = (period) => {
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

const REPORT_TYPES = [
  { id: 'revenue', name: 'Revenue Report', icon: '💰', color: 'from-emerald-500 to-teal-500', description: 'Detailed revenue breakdown by clinic and period' },
  { id: 'patient', name: 'Patient Statistics', icon: '👥', color: 'from-blue-500 to-indigo-500', description: 'Patient flow, demographics, and visit patterns' },
  { id: 'treatment', name: 'Treatment Analysis', icon: '🦷', color: 'from-purple-500 to-pink-500', description: 'Popular treatments and success rates' },
  { id: 'staff', name: 'Staff Performance', icon: '👨‍⚕️', color: 'from-amber-500 to-orange-500', description: 'Doctor productivity and efficiency metrics' },
  { id: 'inventory', name: 'Inventory Report', icon: '📦', color: 'from-cyan-500 to-blue-500', description: 'Stock levels and usage patterns' },
  { id: 'financial', name: 'Financial Summary', icon: '📊', color: 'from-violet-500 to-purple-500', description: 'Complete financial overview and P&L' }
];

export default function ReportsAnalytics() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('analytics'); // 'analytics' or 'reports'
  const [selectedClinic, setSelectedClinic] = useState(SAMPLE_CLINICS[0]);
  const [timePeriod, setTimePeriod] = useState('month');
  const [selectedReportType, setSelectedReportType] = useState(null);
  const [reportConfig, setReportConfig] = useState({
    startDate: '',
    endDate: '',
    format: 'pdf',
    includeCharts: true,
    includeDetails: true
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const chartData = useMemo(() => generateRevenueData(timePeriod), [timePeriod]);

  // Calculate statistics
  const totalRevenue = chartData.revenue.reduce((a, b) => a + b, 0);
  const totalPatients = chartData.patients.reduce((a, b) => a + b, 0);
  const avgRevenuePerPeriod = totalRevenue / chartData.revenue.length;
  const avgPatientsPerPeriod = totalPatients / chartData.patients.length;
  const revenueGrowth = ((chartData.revenue[chartData.revenue.length - 1] - chartData.revenue[0]) / chartData.revenue[0] * 100).toFixed(1);
  const patientGrowth = ((chartData.patients[chartData.patients.length - 1] - chartData.patients[0]) / chartData.patients[0] * 100).toFixed(1);

  const maxRevenue = Math.max(...chartData.revenue);
  const maxPatients = Math.max(...chartData.patients);

  const handleGenerateReport = () => {
    setIsGenerating(true);
    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false);
      alert(`${selectedReportType.name} generated successfully!\nFormat: ${reportConfig.format.toUpperCase()}\nPeriod: ${reportConfig.startDate} to ${reportConfig.endDate}`);
      setSelectedReportType(null);
    }, 2000);
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-700 via-coral-700 to-purple-700 bg-clip-text text-transparent mb-2">
              Reports & Analytics Dashboard
            </h1>
            <p className="text-slate-600">Comprehensive insights, revenue tracking, and report generation</p>
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

        {/* View Toggle */}
        <div className="flex gap-3 mb-6">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveView('analytics')}
            className={`flex-1 px-6 py-4 rounded-xl font-bold shadow-lg transition-all ${
              activeView === 'analytics'
                ? 'bg-gradient-to-r from-teal-500 to-sage-500 text-white'
                : 'bg-white text-slate-700 hover:shadow-xl'
            }`}
          >
            <div className="text-2xl mb-1">📊</div>
            Analytics & Insights
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveView('reports')}
            className={`flex-1 px-6 py-4 rounded-xl font-bold shadow-lg transition-all ${
              activeView === 'reports'
                ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                : 'bg-white text-slate-700 hover:shadow-xl'
            }`}
          >
            <div className="text-2xl mb-1">📄</div>
            Generate Reports
          </motion.button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeView === 'analytics' ? (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Clinic and Period Selectors */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-teal-100 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
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

            {/* Key Metrics */}
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

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-slate-500">
                    <span>₹{(maxRevenue * 1.1).toFixed(0)}</span>
                    <span>₹{(maxRevenue * 0.75).toFixed(0)}</span>
                    <span>₹{(maxRevenue * 0.5).toFixed(0)}</span>
                    <span>₹{(maxRevenue * 0.25).toFixed(0)}</span>
                    <span>₹0</span>
                  </div>

                  <div className="absolute left-16 right-0 top-0 bottom-8 border-l-2 border-b-2 border-slate-200">
                    {[0, 25, 50, 75, 100].map(percent => (
                      <div
                        key={percent}
                        className="absolute left-0 right-0 border-t border-slate-100"
                        style={{ bottom: `${percent}%` }}
                      />
                    ))}

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
                  <div className="absolute left-0 top-0 bottom-8 w-16 flex flex-col justify-between text-xs text-slate-500">
                    <span>{Math.ceil(maxPatients * 1.1)}</span>
                    <span>{Math.ceil(maxPatients * 0.75)}</span>
                    <span>{Math.ceil(maxPatients * 0.5)}</span>
                    <span>{Math.ceil(maxPatients * 0.25)}</span>
                    <span>0</span>
                  </div>

                  <div className="absolute left-16 right-0 top-0 bottom-8 border-l-2 border-b-2 border-slate-200">
                    {[0, 25, 50, 75, 100].map(percent => (
                      <div
                        key={percent}
                        className="absolute left-0 right-0 border-t border-slate-100"
                        style={{ bottom: `${percent}%` }}
                      />
                    ))}

                    <svg className="absolute inset-0 overflow-visible">
                      <defs>
                        <linearGradient id="patientGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.05" />
                        </linearGradient>
                        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                          <stop offset="100%" stopColor="rgb(99, 102, 241)" />
                        </linearGradient>
                      </defs>
                      
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

                  <div className="absolute left-16 right-0 bottom-0 h-8 flex items-center justify-around text-xs text-slate-600 font-medium">
                    {chartData.labels.map((label, index) => (
                      <span key={index} className="flex-1 text-center">{label}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="reports"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Report Types Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {REPORT_TYPES.map((report, index) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  onClick={() => setSelectedReportType(report)}
                  className="bg-white rounded-xl shadow-lg p-6 border border-slate-200 cursor-pointer hover:shadow-2xl transition-all"
                >
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${report.color} flex items-center justify-center text-3xl mb-4 shadow-lg`}>
                    {report.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{report.name}</h3>
                  <p className="text-sm text-slate-600">{report.description}</p>
                </motion.div>
              ))}
            </div>

            {/* Report Configuration Modal */}
            <AnimatePresence>
              {selectedReportType && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                  onClick={() => setSelectedReportType(null)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${selectedReportType.color} flex items-center justify-center text-2xl`}>
                          {selectedReportType.icon}
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold text-slate-800">{selectedReportType.name}</h2>
                          <p className="text-sm text-slate-600">{selectedReportType.description}</p>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSelectedReportType(null)}
                        className="text-slate-400 hover:text-slate-600 text-2xl"
                      >
                        ✕
                      </motion.button>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={reportConfig.startDate}
                            onChange={(e) => setReportConfig({...reportConfig, startDate: e.target.value})}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-2">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={reportConfig.endDate}
                            onChange={(e) => setReportConfig({...reportConfig, endDate: e.target.value})}
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          Report Format
                        </label>
                        <select
                          value={reportConfig.format}
                          onChange={(e) => setReportConfig({...reportConfig, format: e.target.value})}
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-400 focus:border-transparent outline-none"
                        >
                          <option value="pdf">PDF Document</option>
                          <option value="excel">Excel Spreadsheet</option>
                          <option value="csv">CSV File</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={reportConfig.includeCharts}
                            onChange={(e) => setReportConfig({...reportConfig, includeCharts: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-2 focus:ring-violet-400"
                          />
                          <span className="text-sm font-medium text-slate-700">Include Charts & Graphs</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={reportConfig.includeDetails}
                            onChange={(e) => setReportConfig({...reportConfig, includeDetails: e.target.checked})}
                            className="w-5 h-5 rounded border-slate-300 text-violet-600 focus:ring-2 focus:ring-violet-400"
                          />
                          <span className="text-sm font-medium text-slate-700">Include Detailed Breakdown</span>
                        </label>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedReportType(null)}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleGenerateReport}
                        disabled={!reportConfig.startDate || !reportConfig.endDate || isGenerating}
                        className={`flex-1 px-6 py-3 rounded-lg font-bold shadow-lg transition-all ${
                          !reportConfig.startDate || !reportConfig.endDate || isGenerating
                            ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-xl'
                        }`}
                      >
                        {isGenerating ? '⏳ Generating...' : '📥 Generate Report'}
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
