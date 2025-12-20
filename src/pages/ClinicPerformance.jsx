import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getClinicPerformance } from "../api/hmsApi";

const ClinicPerformance = ({ enterpriseId, clinicId, timeSelection }) => {
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getToday = () => new Date().toISOString().split("T")[0];

  const buildParams = () => {
    if (!enterpriseId) return null;

    const baseParams = {
      enterpriseId,
      clinicId: clinicId || undefined,
    };

    switch (timeSelection?.type) {
      case "monthly":
        return {
          ...baseParams,
          periodLabel: "monthly",
          year: timeSelection.year,
          month: timeSelection.month,
        };
      case "quarterly":
        return {
          ...baseParams,
          periodLabel: "quarterly",
          year: timeSelection.year,
          quarter: timeSelection.quarter,
        };
      case "yearly":
        return {
          ...baseParams,
          periodLabel: "yearly",
          year: timeSelection.year,
        };
      case "weekly": {
        const weekStart = timeSelection.startDate || getToday();
        return {
          ...baseParams,
          periodLabel: "weekly",
          startDate: weekStart,
        };
      }
      case "daily": {
        const today = getToday();
        return {
          ...baseParams,
          periodLabel: "daily",
          startDate: today,
        };
      }
      case "custom":
        if (!timeSelection.startDate || !timeSelection.endDate) return null;
        return {
          ...baseParams,
          startDate: timeSelection.startDate,
          endDate: timeSelection.endDate,
        };
      default:
        return {
          ...baseParams,
          periodLabel: "monthly",
          year: timeSelection?.year,
          month: timeSelection?.month,
        };
    }
  };

  useEffect(() => {
    const fetchPerformanceData = async () => {
      // Don't fetch if enterprise ID is not selected
      if (!enterpriseId) {
        setPerformanceData([]);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const params = buildParams();
        if (!params) {
          setPerformanceData([]);
          return;
        }

        const response = await getClinicPerformance(params);

        if (response && response.length > 0) {
          // Transform API response - normalize field names from response
          const transformedData = response.map((item) => ({
            id: item.clinicId || item.clinicID,
            name: item.periodLabel || item.clinicName || "Clinic",
            score: Math.round((item.averageRevenuePerAppointment || 0) / 10) || 85,
            patients: item.totalUsers || 0,
            revenue: item.totalRevenue || 0,
            satisfaction: ((item.averageRevenuePerAppointment || 0) / 100) * 5 || 4.5,
            appointments: item.totalAppointments || 0,
          }));

          setPerformanceData(transformedData);
        } else {
          setPerformanceData([]);
        }
      } catch (err) {
        console.error("Error fetching clinic performance:", err);
        setError(err.message);
        setPerformanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [enterpriseId, clinicId, timeSelection]);

  return (
    <div className="space-y-8">
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-20"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full"
          />
        </motion.div>
      )}

      {error && !loading && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-4 rounded-xl bg-red-50 border-2 border-red-300"
        >
          <p className="text-red-700 font-semibold flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            {error}
          </p>
        </motion.div>
      )}

      {!loading && !error && performanceData.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">🏥</div>
          <p className="text-gray-600 font-semibold text-lg mb-2">No clinic data available</p>
          <p className="text-gray-500">Please select an Enterprise to view clinic performance</p>
        </motion.div>
      )}

      {!loading && !error && performanceData.length > 0 && (
        <>
          {/* Performance Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-teal-500 via-cyan-500 to-blue-500 rounded-3xl shadow-2xl p-8 text-white relative overflow-hidden"
          >
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                rotate: [0, 180, 360],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 10, repeat: Infinity }}
              className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"
            />
            
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <span className="text-5xl">🏥</span>
                Clinic Performance Overview
              </h2>
              <p className="text-cyan-100 text-lg">Comparative analysis across all facilities</p>
            </div>
          </motion.div>

          {/* Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {performanceData.map((clinic, index) => (
              <motion.div
                key={clinic.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-white rounded-2xl shadow-xl border-2 border-teal-100 overflow-hidden"
              >
                {/* Header with score */}
                <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-6 relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-1">{clinic.name}</h3>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span key={i} className={`text-xl ${i < Math.floor(clinic.satisfaction) ? 'opacity-100' : 'opacity-30'}`}>
                            ⭐
                          </span>
                        ))}
                        <span className="text-white font-semibold ml-2">{clinic.satisfaction}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-white/20 rounded-full blur-lg"
                      />
                      <div className="relative w-20 h-20 rounded-full bg-white flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-3xl font-bold text-teal-600">{clinic.score}</div>
                          <div className="text-xs text-gray-600">Score</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="p-6 space-y-4">
                  {/* Patients */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 font-semibold flex items-center gap-2">
                        <span className="text-xl">👥</span>
                        Total Patients
                      </span>
                      <span className="text-2xl font-bold text-gray-800">{clinic.patients}</span>
                    </div>
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(clinic.patients / 600) * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.1 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                      >
                        <motion.div
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Revenue */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 font-semibold flex items-center gap-2">
                        <span className="text-xl">💰</span>
                        Revenue
                      </span>
                      <span className="text-2xl font-bold text-gray-800">
                        ${(clinic.revenue / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(clinic.revenue / 150000) * 100}%` }}
                        transition={{ duration: 1, delay: index * 0.1 + 0.2 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full"
                      >
                        <motion.div
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                      </motion.div>
                    </div>
                  </div>

                  {/* Performance Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-600 font-semibold flex items-center gap-2">
                        <span className="text-xl">📊</span>
                        Performance
                      </span>
                      <span className="text-2xl font-bold text-gray-800">{clinic.score}%</span>
                    </div>
                    <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${clinic.score}%` }}
                        transition={{ duration: 1, delay: index * 0.1 + 0.4 }}
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full"
                      >
                        <motion.div
                          animate={{ x: ['-100%', '100%'] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                      </motion.div>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                <div className="px-6 pb-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${
                      clinic.score >= 90
                        ? 'bg-green-100 text-green-700'
                        : clinic.score >= 85
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    <span className="text-xl">
                      {clinic.score >= 90 ? '🏆' : clinic.score >= 85 ? '⭐' : '📈'}
                    </span>
                    {clinic.score >= 90 ? 'Excellent' : clinic.score >= 85 ? 'Good' : 'Improving'}
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Comparative Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-3xl shadow-2xl border-2 border-teal-100 p-8"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <span className="text-3xl">📈</span>
              Comparative Performance Analysis
            </h3>

            <div className="space-y-8">
              {['Patients', 'Revenue', 'Satisfaction', 'Overall Score'].map((metric, metricIndex) => {
                const getMetricValue = (clinic) => {
                  switch (metric) {
                    case 'Patients':
                      return clinic.patients;
                    case 'Revenue':
                      return clinic.revenue / 1000;
                    case 'Satisfaction':
                      return clinic.satisfaction * 20;
                    case 'Overall Score':
                      return clinic.score;
                    default:
                      return 0;
                  }
                };

                const maxValue = Math.max(...performanceData.map(getMetricValue));
                const colors = [
                  'from-blue-400 to-blue-600',
                  'from-green-400 to-emerald-600',
                  'from-yellow-400 to-orange-600',
                  'from-purple-400 to-pink-600',
                ];

                return (
                  <div key={metric}>
                    <div className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="text-lg">
                        {metric === 'Patients' ? '👥' : metric === 'Revenue' ? '💰' : metric === 'Satisfaction' ? '⭐' : '📊'}
                      </span>
                      {metric}
                    </div>
                    <div className="space-y-2">
                      {performanceData.map((clinic, clinicIndex) => {
                        const value = getMetricValue(clinic);
                        return (
                          <div key={clinic.id} className="flex items-center gap-4">
                            <div className="w-40 text-sm font-medium text-gray-600 truncate">
                              {clinic.name}
                            </div>
                            <div className="flex-1 relative h-8 bg-gray-100 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(value / maxValue) * 100}%` }}
                                transition={{ duration: 1, delay: metricIndex * 0.2 + clinicIndex * 0.1 }}
                                className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors[metricIndex]} rounded-full flex items-center justify-end pr-3`}
                              >
                                <motion.div
                                  animate={{ x: ['-100%', '100%'] }}
                                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                                />
                                <span className="relative z-10 text-white font-bold text-sm">
                                  {metric === 'Revenue' ? `$${value.toFixed(0)}K` : value.toFixed(metric === 'Satisfaction' ? 0 : 0)}
                                </span>
                              </motion.div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Key Insights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {[
              {
                title: "Top Performer",
                value: performanceData.reduce((max, clinic) => (clinic.score > max.score ? clinic : max), performanceData[0])?.name,
                icon: "🏆",
                color: "from-yellow-400 to-orange-500",
              },
              {
                title: "Highest Revenue",
                value: `$${(performanceData.reduce((max, clinic) => (clinic.revenue > max.revenue ? clinic : max), performanceData[0])?.revenue / 1000).toFixed(0)}K`,
                icon: "💎",
                color: "from-green-400 to-emerald-500",
              },
              {
                title: "Best Satisfaction",
                value: `${performanceData.reduce((max, clinic) => (clinic.satisfaction > max.satisfaction ? clinic : max), performanceData[0])?.satisfaction} ⭐`,
                icon: "😊",
                color: "from-pink-400 to-rose-500",
              },
            ].map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                className={`bg-gradient-to-br ${insight.color} rounded-2xl p-6 text-white shadow-xl relative overflow-hidden`}
              >
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl"
                />
                <div className="relative z-10">
                  <div className="text-5xl mb-3">{insight.icon}</div>
                  <div className="text-sm opacity-90 mb-2">{insight.title}</div>
                  <div className="text-2xl font-bold">{insight.value}</div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default ClinicPerformance;
