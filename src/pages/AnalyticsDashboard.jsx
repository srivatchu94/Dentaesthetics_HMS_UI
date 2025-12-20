import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getRevenueAnalytics } from "../api/hmsApi";

const AnalyticsDashboard = ({ enterpriseId, clinicId, timeSelection }) => {
  const [chartData, setChartData] = useState([]);
  const [summaryData, setSummaryData] = useState({
    totalPatients: 0,
    totalAppointments: 0,
    totalRevenue: 0,
    averageRevenue: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getToday = () => new Date().toISOString().split("T")[0];

  const normalizeRevenueItem = (item, index) => {
    const periodLabel = item.periodLabel || item.PeriodLabel || `Period ${index + 1}`;
    const totalRevenue = item.totalRevenue ?? item.TotalRevenue ?? 0;
    const totalAppointments = item.totalAppointments ?? item.TotalAppointments ?? 0;
    const paidAmount = item.paidAmount ?? item.PaidAmount ?? 0;
    const pendingAmount = item.pendingAmount ?? item.PendingAmount ?? 0;
    const averageRevenue = item.averageRevenue ?? item.AverageRevenue ?? 0;

    return {
      label: periodLabel,
      value: totalRevenue,
      appointments: totalAppointments,
      paidAmount,
      pendingAmount,
      averageRevenue,
      color: index,
    };
  };

  const filterAndNormalizeResponse = (response) => {
    if (!response || response.length === 0) return [];

    // Remove MONTHLY/QUARTERLY/YEARLY TOTAL rows only; show all data rows (even with null/zero values)
    const filtered = response.filter((item) => {
      const label = item.periodLabel || "";
      const isTotal = label.toUpperCase().includes("TOTAL");
      return !isTotal;
    });

    return filtered.map(normalizeRevenueItem);
  };

  const extractSummaryFromResponse = (response) => {
    if (!response || response.length === 0) {
      return {
        totalPatients: 0,
        totalAppointments: 0,
        totalRevenue: 0,
        averageRevenue: 0,
      };
    }

    // Find the TOTAL row to use for summary
    const totalRow = response.find((item) => {
      const label = item.periodLabel || "";
      return label.toUpperCase().includes("TOTAL");
    });

    if (totalRow) {
      return {
        totalPatients: totalRow.totalAppointments ?? 0,
        totalAppointments: totalRow.totalAppointments ?? 0,
        totalRevenue: totalRow.totalRevenue ?? 0,
        averageRevenue: totalRow.averageRevenue ?? 0,
      };
    }

    // Fallback: sum non-total rows
    const totals = response.reduce(
      (acc, item) => {
        const label = item.periodLabel || "";
        const isTotal = label.toUpperCase().includes("TOTAL");
        if (!isTotal) {
          return {
            totalAppointments: acc.totalAppointments + (item.totalAppointments ?? 0),
            totalRevenue: acc.totalRevenue + (item.totalRevenue ?? 0),
          };
        }
        return acc;
      },
      { totalAppointments: 0, totalRevenue: 0 }
    );

    return {
      totalPatients: totals.totalAppointments,
      totalAppointments: totals.totalAppointments,
      totalRevenue: totals.totalRevenue,
      averageRevenue: totals.totalAppointments > 0 ? totals.totalRevenue / totals.totalAppointments : 0,
    };
  };

  // Fetch analytics data from API
  useEffect(() => {
    const buildParams = () => {
      if (!enterpriseId) return null;

      const baseParams = {
        enterpriseId,
        clinicId: clinicId || undefined,
        useActiveMonthsOnly: false,
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
        case "weekly":
          return {
            ...baseParams,
            periodLabel: "weekly",
          };
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

    const fetchAnalyticsData = async () => {
      const params = buildParams();
      if (!params) {
        setChartData([]);
        setSummaryData({
          totalPatients: 0,
          totalAppointments: 0,
          totalRevenue: 0,
          averageRevenue: 0,
        });
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await getRevenueAnalytics(params);

        if (response && response.length > 0) {
          const transformedData = filterAndNormalizeResponse(response);
          const summary = extractSummaryFromResponse(response);

          console.log("📊 API Response:", response);
          console.log("📈 Filtered Chart Data:", transformedData);
          console.log("📋 Summary Data:", summary);

          setChartData(transformedData);
          setSummaryData(summary);
        } else {
          setChartData([]);
          setSummaryData({
            totalPatients: 0,
            totalAppointments: 0,
            totalRevenue: 0,
            averageRevenue: 0,
          });
        }
      } catch (err) {
        console.error("Error fetching analytics:", err);
        const message = err.message || "Failed to load analytics";

        if (message.startsWith("HTTP 404")) {
          // No data found for this period - treat as empty state
          setError("");
        } else if (message.startsWith("HTTP 500")) {
          // Server error - user-friendly message
          setError("Unable to retrieve analytics. Server connection issue. Please try again in a moment or select a different time period.");
        } else {
          setError(message);
        }

        setChartData([]);
        setSummaryData({
          totalPatients: 0,
          totalAppointments: 0,
          totalRevenue: 0,
          averageRevenue: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [enterpriseId, clinicId, timeSelection]);

  const maxValue = Math.max(...chartData.map((d) => d.value || 0), 1);

  return (
    <div className="space-y-8">
      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center py-20"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full"
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

      {!loading && !error && (
        <>
          {chartData.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-600 font-semibold text-lg mb-2">No data available</p>
              <p className="text-gray-500">Please select an Enterprise to view analytics</p>
            </motion.div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: "Total Patients", value: summaryData.totalPatients.toLocaleString(), icon: "👥", color: "from-slate-700 to-slate-900", change: "" },
                  { title: "Appointments", value: summaryData.totalAppointments.toLocaleString(), icon: "📅", color: "from-blue-700 to-sky-900", change: "" },
                  { title: "Revenue", value: `₹${(summaryData.totalRevenue / 1000).toFixed(1)}K`, icon: "💰", color: "from-emerald-700 to-teal-900", change: "" },
                  { title: "Avg Revenue", value: summaryData.averageRevenue ? `₹${summaryData.averageRevenue.toFixed(0)}` : "₹0", icon: "📈", color: "from-indigo-700 to-slate-900", change: "" },
                ].map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 shadow-xl text-white relative overflow-hidden`}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl"
                />
                <div className="relative z-10">
                  <div className="text-4xl mb-2">{card.icon}</div>
                  <div className="text-2xl font-bold mb-1">{card.value}</div>
                  <div className="text-sm opacity-90">{card.title}</div>
                  {card.change ? (
                    <div className="mt-2 text-xs font-semibold bg-white/20 inline-block px-2 py-1 rounded-full">
                      {card.change}
                    </div>
                  ) : null}
                </div>
              </motion.div>
                ))}
              </div>

              {/* Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl shadow-2xl border-2 border-purple-500/50 p-8 relative overflow-hidden"
          >
            {/* Animated background orbs */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.1, 0.2, 0.1],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute -right-20 -top-20 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl"
            />
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.1, 0.15, 0.1],
              }}
              transition={{ duration: 10, repeat: Infinity, delay: 1 }}
              className="absolute -left-20 -bottom-20 w-64 h-64 bg-pink-500/30 rounded-full blur-3xl"
            />

            <div className="relative z-10 flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <span className="text-3xl">📊</span>
                Patient Visits Analytics
              </h2>
              <div className="flex items-center gap-2 text-sm text-purple-200">
                <span className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse"></span>
                Current Period
              </div>
            </div>

            <div className="relative z-10 h-80">
              <div className="absolute inset-0 flex items-end justify-around gap-4 px-4">
                {chartData.map((item, index) => {
                  const mutedGradients = [
                    "linear-gradient(180deg, #4F46E5, #1E293B)",
                    "linear-gradient(180deg, #0EA5E9, #0B1727)",
                    "linear-gradient(180deg, #14B8A6, #0F172A)",
                    "linear-gradient(180deg, #2563EB, #0B1224)",
                    "linear-gradient(180deg, #1E3A8A, #0F172A)",
                    "linear-gradient(180deg, #10B981, #0B1727)",
                  ];

                  return (
                    <motion.div
                      key={index}
                      initial={{ height: 0 }}
                      animate={{ height: `${(item.value / maxValue) * 100}%` }}
                      transition={{ delay: index * 0.1, duration: 0.8, type: "spring" }}
                      className="flex-1 relative group cursor-pointer"
                    >
                      <motion.div
                        whileHover={{ scale: 1.08, boxShadow: "0 0 30px rgba(255,255,255,0.3)" }}
                        className="w-full h-full rounded-t-2xl relative overflow-hidden shadow-2xl"
                        style={{
                          background: mutedGradients[index % mutedGradients.length],
                          boxShadow: "0 12px 32px rgba(15, 23, 42, 0.35)",
                        }}
                      >
                        {/* Animated shimmer effect */}
                        <motion.div
                          animate={{
                            x: ["-100%", "100%"],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
                        />

                        {/* Animated glow effect */}
                        <motion.div
                          animate={{
                            opacity: [0.4, 0.8, 0.4],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                          className="absolute inset-0 bg-white/10"
                        />
                        
                        {/* Value label */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 + 0.5 }}
                          className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg shadow-md font-bold text-sm whitespace-nowrap text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {item.value ? `₹${item.value.toLocaleString()}` : "₹0"}
                        </motion.div>
                      </motion.div>
                      
                      {/* Label */}
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-semibold text-white whitespace-nowrap">
                        {item.label}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Legend with vibrant colors */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="relative z-10 mt-20 pt-6 border-t border-purple-500/30 flex flex-wrap gap-6 justify-center"
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-4 h-4 rounded-full bg-gradient-to-r from-red-500 to-pink-500"
                />
                <span className="text-sm font-semibold text-purple-200">Peak Performance</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500"
                />
                <span className="text-sm font-semibold text-purple-200">Active Metrics</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
                  className="w-4 h-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
                />
                <span className="text-sm font-semibold text-purple-200">Growth Trend</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Professional Patient Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-3">
              <span className="text-3xl">📋</span>
              Patient Visit Summary
            </h2>
            <p className="text-gray-600 mb-8">Detailed breakdown of patient activity and revenue by period</p>

            {/* Timeline Container */}
            {chartData.length > 0 ? (
              <div className="space-y-4">
                {chartData.map((period, index) => {
                  const totalValue = period.value || 0;
                  const paidAmount = period.paidAmount || 0;
                  const pendingAmount = period.pendingAmount || 0;
                  const appointments = period.appointments || 0;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                    >
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3.5 h-3.5 rounded-full ${index === 0 ? 'bg-green-500 ring-2 ring-green-200' : 'bg-blue-400'}`} />
                      {index < chartData.length - 1 && <div className="w-0.5 h-6 bg-gradient-to-b from-gray-300 to-transparent mt-1" />}
                    </div>

                    {/* Period details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-2 mb-3">
                        <div>
                          <p className="font-semibold text-gray-800">{period.label}</p>
                          <p className="text-xs text-gray-500">📊 {appointments} Appointments</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-green-600">₹{(totalValue / 1000).toFixed(1)}K</p>
                          <p className="text-xs text-gray-500">Total Revenue</p>
                        </div>
                      </div>

                      {/* Progress indicators */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">Paid ✓</span>
                            <span className="font-semibold text-green-600">₹{(paidAmount / 1000).toFixed(1)}K</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div 
                              className="bg-green-500 h-2 rounded-full" 
                              initial={{ width: 0 }}
                              animate={{ width: `${totalValue ? (paidAmount / totalValue) * 100 : 0}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-600 font-medium">Pending ⏳</span>
                            <span className="font-semibold text-orange-600">₹{(pendingAmount / 1000).toFixed(1)}K</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div 
                              className="bg-orange-500 h-2 rounded-full" 
                              initial={{ width: 0 }}
                              animate={{ width: `${totalValue ? (pendingAmount / totalValue) * 100 : 0}%` }}
                              transition={{ duration: 0.8, delay: 0.2 }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">📋 Select an enterprise to view patient visit summary</p>
              </div>
            )}

            {/* Key Performance Indicators */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-gray-200">
              {[
                { label: "Avg Revenue/Visit", value: summaryData.averageRevenue ? `₹${summaryData.averageRevenue.toFixed(0)}` : "—", icon: "💰", trend: "+12%" },
                { label: "Total Visits", value: summaryData.totalAppointments, icon: "👥", trend: "+8%" },
                { label: "Collection Rate", value: chartData.length > 0 && summaryData.totalRevenue > 0 ? `${((chartData.reduce((acc, c) => acc + c.paidAmount, 0) / summaryData.totalRevenue) * 100).toFixed(1)}%` : "—", icon: "📊", trend: "+5%" },
              ].map((metric, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.1 }}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-gray-600 text-xs font-medium mb-1">{metric.label}</p>
                      <p className="text-2xl font-bold text-gray-800">{metric.value}</p>
                      <p className="text-xs text-green-600 mt-1 font-semibold">{metric.trend} vs prev</p>
                    </div>
                    <span className="text-2xl">{metric.icon}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>            </>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
