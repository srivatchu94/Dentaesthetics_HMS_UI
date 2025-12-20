import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getUserStatistics } from "../api/hmsApi";

const UserStatistics = ({ enterpriseId, clinicId, timeSelection }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState("all");
  const [error, setError] = useState("");

  const getToday = () => new Date().toISOString().split("T")[0];

  const buildParams = () => {
    if (!enterpriseId) return null;

    const baseParams = {
      enterpriseId,
      clinicId: clinicId || undefined,
    };

    switch (timeSelection?.type) {
      case "daily": {
        const today = getToday();
        return {
          ...baseParams,
          periodLabel: "daily",
          startDate: today,
        };
      }
      case "weekly": {
        const weekStart = timeSelection.startDate || getToday();
        return {
          ...baseParams,
          periodLabel: "weekly",
          startDate: weekStart,
        };
      }
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
    const fetchUserStats = async () => {
      // Enterprise ID is required
      if (!enterpriseId) {
        setUserData(null);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const params = buildParams();
        if (!params) {
          setUserData(null);
          return;
        }

        const response = await getUserStatistics(params);

        if (response && response.length > 0) {
          // Transform API response - normalize field names
          const timeData = response.map((item) => ({
            label: item.periodLabel || "Period",
            new: item.newUsers || 0,
            returning: item.returnUsers || 0,
            total: item.totalUsers || 0,
          }));

          const totalNew = timeData.reduce((sum, d) => sum + d.new, 0);
          const totalReturning = timeData.reduce((sum, d) => sum + d.returning, 0);
          const total = totalNew + totalReturning;

          setUserData({
            timeData,
            summary: {
              totalNew,
              totalReturning,
              total,
              newPercentage: total > 0 ? ((totalNew / total) * 100).toFixed(1) : 0,
              returningPercentage: total > 0 ? ((totalReturning / total) * 100).toFixed(1) : 0,
              retentionRate: total > 0 ? ((totalReturning / total) * 100).toFixed(1) : 0,
            },
          });
        } else {
          setUserData(null);
        }
      } catch (err) {
        console.error("Error fetching user statistics:", err);
        const message = err.message || "Failed to load user statistics";
        if (message.startsWith("HTTP 404")) {
          setError("");
        } else if (message.startsWith("HTTP 500")) {
          setError("Unable to retrieve user statistics. Server connection issue. Please try again in a moment or select a different time period.");
        } else {
          setError(message);
        }
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [enterpriseId, clinicId, timeSelection]);

  if (loading || !userData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-20"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-16 h-16 border-4 border-pink-200 border-t-pink-600 rounded-full"
        />
      </motion.div>
    );
  }

  if (error) {
    return (
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
    );
  }

  if (!userData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <div className="text-6xl mb-4">👥</div>
        <p className="text-gray-600 font-semibold text-lg mb-2">No user data available</p>
        <p className="text-gray-500">Please select an Enterprise/Clinic to view user statistics</p>
      </motion.div>
    );
  }

  const maxValue = Math.max(
    ...userData.timeData.map((d) => Math.max(d.new, d.returning))
  );

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            title: "Total Users",
            value: userData.summary.total.toLocaleString(),
            icon: "👥",
            color: "from-indigo-500 to-purple-500",
            detail: "All patients",
          },
          {
            title: "New Users",
            value: userData.summary.totalNew.toLocaleString(),
            icon: "🆕",
            color: "from-green-500 to-emerald-500",
            detail: `${userData.summary.newPercentage}% of total`,
          },
          {
            title: "Returning Users",
            value: userData.summary.totalReturning.toLocaleString(),
            icon: "🔄",
            color: "from-blue-500 to-cyan-500",
            detail: `${userData.summary.returningPercentage}% of total`,
          },
          {
            title: "Retention Rate",
            value: `${userData.summary.retentionRate}%`,
            icon: "📊",
            color: "from-pink-500 to-rose-500",
            detail: "Patient loyalty",
          },
        ].map((card, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -8 }}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 shadow-xl text-white relative overflow-hidden cursor-pointer`}
          >
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                rotate: [0, 180, 360],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 8, repeat: Infinity }}
              className="absolute -right-12 -top-12 w-40 h-40 bg-white/10 rounded-full blur-3xl"
            />
            <div className="relative z-10">
              <div className="text-5xl mb-3">{card.icon}</div>
              <div className="text-3xl font-bold mb-2">{card.value}</div>
              <div className="text-sm opacity-90">{card.title}</div>
              <div className="text-xs opacity-75 mt-2">{card.detail}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Donut Chart - User Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-3xl shadow-2xl border-2 border-pink-100 p-8"
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <span className="text-3xl">🎯</span>
          User Distribution Analysis
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Animated Donut Chart */}
          <div className="relative flex items-center justify-center">
            <svg width="300" height="300" viewBox="0 0 300 300" className="transform -rotate-90">
              <defs>
                <linearGradient id="newGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
                <linearGradient id="returningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>

              {/* Background circle */}
              <circle
                cx="150"
                cy="150"
                r="120"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="40"
              />

              {/* Returning users arc */}
              <motion.circle
                cx="150"
                cy="150"
                r="120"
                fill="none"
                stroke="url(#returningGradient)"
                strokeWidth="40"
                strokeLinecap="round"
                strokeDasharray={`${(userData.summary.returningPercentage / 100) * 754} 754`}
                initial={{ strokeDasharray: "0 754" }}
                animate={{ strokeDasharray: `${(userData.summary.returningPercentage / 100) * 754} 754` }}
                transition={{ duration: 2, ease: "easeOut" }}
              />

              {/* New users arc */}
              <motion.circle
                cx="150"
                cy="150"
                r="120"
                fill="none"
                stroke="url(#newGradient)"
                strokeWidth="40"
                strokeLinecap="round"
                strokeDasharray={`${(userData.summary.newPercentage / 100) * 754} 754`}
                strokeDashoffset={`-${(userData.summary.returningPercentage / 100) * 754}`}
                initial={{ strokeDasharray: "0 754" }}
                animate={{ strokeDasharray: `${(userData.summary.newPercentage / 100) * 754} 754` }}
                transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
              />
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1, type: "spring" }}
                  className="text-5xl font-bold text-gray-800 mb-2"
                >
                  {userData.summary.total.toLocaleString()}
                </motion.div>
                <div className="text-gray-600 font-semibold">Total Users</div>
              </div>
            </div>
          </div>

          {/* Legend and Stats */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border-2 border-green-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-2xl">
                  🆕
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800">
                    {userData.summary.totalNew.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">New Users</div>
                </div>
                <div className="text-3xl font-bold text-green-600">
                  {userData.summary.newPercentage}%
                </div>
              </div>
              <div className="relative h-3 bg-white rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${userData.summary.newPercentage}%` }}
                  transition={{ duration: 1.5, delay: 1 }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1 }}
              className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center text-2xl">
                  🔄
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800">
                    {userData.summary.totalReturning.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Returning Users</div>
                </div>
                <div className="text-3xl font-bold text-blue-600">
                  {userData.summary.returningPercentage}%
                </div>
              </div>
              <div className="relative h-3 bg-white rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${userData.summary.returningPercentage}%` }}
                  transition={{ duration: 1.5, delay: 1.2 }}
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Metric Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center gap-4"
      >
        {[
          { id: "all", label: "All Users", icon: "👥" },
          { id: "new", label: "New Users", icon: "🆕" },
          { id: "returning", label: "Returning Users", icon: "🔄" },
        ].map((metric) => (
          <motion.button
            key={metric.id}
            onClick={() => setSelectedMetric(metric.id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              selectedMetric === metric.id
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-xl"
                : "bg-white text-gray-700 border-2 border-gray-200 hover:border-purple-300"
            }`}
          >
            <span className="text-xl">{metric.icon}</span>
            {metric.label}
          </motion.button>
        ))}
      </motion.div>

      {/* Time Series Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-3xl shadow-2xl border-2 border-purple-100 p-8"
      >
        <h3 className="text-2xl font-bold text-gray-800 mb-8 flex items-center gap-3">
          <span className="text-3xl">📈</span>
          User Growth Over Time
        </h3>

        <div className="relative h-96">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="border-t border-gray-200" />
            ))}
          </div>

          {/* Chart bars */}
          <div className="absolute inset-0 flex items-end justify-around gap-2 px-4 pt-8">
            {userData.timeData.map((item, index) => {
              const showNew = selectedMetric === "all" || selectedMetric === "new";
              const showReturning = selectedMetric === "all" || selectedMetric === "returning";

              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  {/* Returning users bar (blue) */}
                  {showReturning && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${(item.returning / maxValue) * 100}%`, opacity: 1 }}
                      transition={{ delay: index * 0.1, duration: 0.8, type: "spring" }}
                      className="w-full rounded-t-xl relative group cursor-pointer"
                      style={{
                        background: "linear-gradient(180deg, #3b82f6, #06b6d4)",
                      }}
                    >
                      <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.returning} 🔄
                      </div>
                    </motion.div>
                  )}

                  {/* New users bar (green) */}
                  {showNew && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${(item.new / maxValue) * 100}%`, opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.8, type: "spring" }}
                      className="w-full rounded-t-xl relative group cursor-pointer"
                      style={{
                        background: "linear-gradient(180deg, #10b981, #059669)",
                      }}
                    >
                      <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear", delay: 0.5 }}
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      />
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-2 py-1 rounded text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {item.new} 🆕
                      </div>
                    </motion.div>
                  )}

                  {/* Label */}
                  <div className="text-xs font-semibold text-gray-600 mt-2 whitespace-nowrap">
                    {item.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-8 mt-8">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-green-500 to-emerald-500" />
            <span className="text-sm font-semibold text-gray-700">New Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-r from-blue-500 to-cyan-500" />
            <span className="text-sm font-semibold text-gray-700">Returning Users</span>
          </div>
        </div>
      </motion.div>

      {/* Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          {
            title: "Growth Rate",
            value: "+18.5%",
            description: "Compared to last period",
            icon: "📈",
            color: "from-purple-500 to-indigo-500",
          },
          {
            title: "Avg. Visits",
            value: "3.2",
            description: "Per returning user",
            icon: "🔁",
            color: "from-blue-500 to-cyan-500",
          },
          {
            title: "Conversion",
            value: "67%",
            description: "New to returning rate",
            icon: "✨",
            color: "from-pink-500 to-rose-500",
          },
        ].map((insight, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.1 + index * 0.1 }}
            whileHover={{ scale: 1.05, rotate: 2 }}
            className={`bg-gradient-to-br ${insight.color} rounded-2xl p-6 text-white shadow-xl relative overflow-hidden`}
          >
            <motion.div
              animate={{
                scale: [1, 1.4, 1],
                rotate: [0, 90, 180],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"
            />
            <div className="relative z-10">
              <div className="text-5xl mb-3">{insight.icon}</div>
              <div className="text-3xl font-bold mb-2">{insight.value}</div>
              <div className="text-sm opacity-90 mb-1">{insight.title}</div>
              <div className="text-xs opacity-75">{insight.description}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default UserStatistics;
