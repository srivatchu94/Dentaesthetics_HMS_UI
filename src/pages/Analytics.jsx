import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import AnalyticsDashboard from "./AnalyticsDashboard";
import ClinicPerformance from "./ClinicPerformance";
import UserStatistics from "./UserStatistics";
import { getAllEnterprises, getClinicsByEnterpriseId } from "../api/hmsApi";

const Analytics = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [enterpriseId, setEnterpriseId] = useState("");
  const [clinicId, setClinicId] = useState("");
  const [timePeriod, setTimePeriod] = useState("monthly");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [dateError, setDateError] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState(1);
  const [enterprises, setEnterprises] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loadingEnterprises, setLoadingEnterprises] = useState(true);
  const [loadingClinics, setLoadingClinics] = useState(false);
  const [enterpriseError, setEnterpriseError] = useState("");
  const [clinicError, setClinicError] = useState("");

  const timePeriods = [
    { value: "daily", label: "Daily", icon: "📅" },
    { value: "weekly", label: "Weekly", icon: "📊" },
    { value: "monthly", label: "Monthly", icon: "📈" },
    { value: "quarterly", label: "Quarterly", icon: "📉" },
    { value: "yearly", label: "Yearly", icon: "🗓️" },
    { value: "custom", label: "Custom Range", icon: "🔧" },
  ];

  // Fetch all enterprises on component mount
  useEffect(() => {
    const fetchEnterprises = async () => {
      try {
        setLoadingEnterprises(true);
        setEnterpriseError("");
        const data = await getAllEnterprises();
        console.log("✅ Enterprises fetched:", data);
        setEnterprises(data || []);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load enterprises";
        console.error("❌ Error fetching enterprises:", errorMsg, err);
        setEnterpriseError(errorMsg);
        setEnterprises([]);
      } finally {
        setLoadingEnterprises(false);
      }
    };

    fetchEnterprises();
  }, []);

  // Fetch clinics when enterprise is selected
  useEffect(() => {
    const fetchClinics = async () => {
      if (!enterpriseId) {
        setClinics([]);
        return;
      }

      try {
        setLoadingClinics(true);
        setClinicError("");
        setClinicId(""); // Reset clinic selection when enterprise changes
        console.log("🔄 Fetching clinics for enterprise:", enterpriseId);
        const data = await getClinicsByEnterpriseId(Number(enterpriseId));
        console.log("✅ Clinics fetched:", data);
        setClinics(data || []);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Failed to load clinics";
        console.error("❌ Error fetching clinics for enterprise", enterpriseId, ":", errorMsg, err);
        setClinicError(errorMsg);
        setClinics([]);
      } finally {
        setLoadingClinics(false);
      }
    };

    fetchClinics();
  }, [enterpriseId]);

  const tabs = [
    { id: "dashboard", label: "Analytics Dashboard", icon: "📊", color: "from-purple-500 to-indigo-500" },
    { id: "performance", label: "Clinic Performance", icon: "🏥", color: "from-teal-500 to-cyan-500" },
    { id: "users", label: "User Statistics", icon: "👥", color: "from-pink-500 to-rose-500" },
  ];

  // Validate dates when either start or end date changes
  const handleDateChange = (field, value) => {
    const newDateRange = { ...customDateRange, [field]: value };
    setCustomDateRange(newDateRange);

    // Validate only if both dates are filled
    if (newDateRange.start && newDateRange.end) {
      const startDate = new Date(newDateRange.start);
      const endDate = new Date(newDateRange.end);

      if (endDate < startDate) {
        setDateError(`❌ End date cannot be before start date`);
      } else {
        setDateError("");
      }
    } else {
      setDateError("");
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];

    if (timePeriod === "custom") {
      setShowCustomDate(true);
      setDateError("");
    } else {
      setShowCustomDate(false);
      setDateError("");
      if (timePeriod === "daily") {
        setCustomDateRange({ start: today, end: today });
      }
    }
  }, [timePeriod]);

  const renderTabContent = () => {
    const timeSelection = {
      type: timePeriod,
      month: selectedMonth,
      year: selectedYear,
      quarter: selectedQuarter,
      startDate: customDateRange.start,
      endDate: customDateRange.end,
    };

    const commonProps = {
      enterpriseId,
      clinicId,
      timeSelection,
    };

    switch (activeTab) {
      case "dashboard":
        return <AnalyticsDashboard {...commonProps} />;
      case "performance":
        return <ClinicPerformance {...commonProps} />;
      case "users":
        return <UserStatistics {...commonProps} />;
      default:
        return <AnalyticsDashboard {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/30 pt-8 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <motion.h1
            className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent mb-3"
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 5, repeat: Infinity }}
          >
            📊 Analytics Hub
          </motion.h1>
          <p className="text-gray-600 text-lg">Comprehensive insights and performance metrics</p>
        </motion.div>

        {/* Filters Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl border-2 border-purple-100 p-6 mb-8"
        >
          {/* Row 1: Enterprise & Clinic Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Enterprise Dropdown */}
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl">🏢</span>
                Enterprise {loadingEnterprises && <span className="text-xs animate-spin">⏳</span>}
              </label>
              <select
                value={enterpriseId}
                onChange={(e) => setEnterpriseId(e.target.value)}
                disabled={loadingEnterprises || enterprises.length === 0}
                className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 outline-none transition-all font-semibold text-gray-700 cursor-pointer hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{loadingEnterprises ? "Loading..." : "Select Enterprise"}</option>
                {enterprises.map((ent) => (
                  <option key={ent.enterpriseId} value={ent.enterpriseId}>
                    {ent.enterpriseName}
                  </option>
                ))}
              </select>
              {enterpriseError && <p className="text-xs text-red-600 mt-1">⚠️ {enterpriseError}</p>}
            </div>

            {/* Clinic Dropdown */}
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl">🏥</span>
                Clinic (Optional) {loadingClinics && <span className="text-xs animate-spin">⏳</span>}
              </label>
              <select
                value={clinicId}
                onChange={(e) => setClinicId(e.target.value)}
                disabled={!enterpriseId || loadingClinics}
                className="w-full px-4 py-3 rounded-xl border-2 border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 focus:border-teal-500 focus:ring-4 focus:ring-teal-100 outline-none transition-all font-semibold text-gray-700 cursor-pointer hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{!enterpriseId ? "Select Enterprise first" : loadingClinics ? "Loading..." : "Select Clinic (Optional)"}</option>
                {clinics.map((clinic) => (
                  <option key={clinic.clinicId} value={clinic.clinicId}>
                    {clinic.clinicName}
                  </option>
                ))}
              </select>
              {clinicError && <p className="text-xs text-red-600 mt-1">⚠️ {clinicError}</p>}
            </div>
          </div>

          {/* Row 2: Time Period Selection (only enabled after enterprise is selected) */}
          <div className="grid grid-cols-1 gap-6">
            {/* Time Period Dropdown */}
            <div className="relative">
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-xl">⏰</span>
                Time Period
              </label>
              <select
                value={timePeriod}
                onChange={(e) => setTimePeriod(e.target.value)}
                disabled={!enterpriseId}
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 bg-gradient-to-r from-pink-50 to-rose-50 focus:border-pink-500 focus:ring-4 focus:ring-pink-100 outline-none transition-all font-semibold text-gray-700 cursor-pointer hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {timePeriods.map((period) => (
                  <option key={period.value} value={period.value}>
                    {period.icon} {period.label}
                  </option>
                ))}
              </select>
              {!enterpriseId && <p className="text-xs text-gray-500 mt-1">ℹ️ Select an Enterprise first</p>}
            </div>
          </div>

          {/* Period-specific selectors */}
          <AnimatePresence>
            {timePeriod === "monthly" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Month</label>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-gray-700"
                  >
                    {[1,2,3,4,5,6,7,8,9,10,11,12].map((m) => (
                      <option key={m} value={m}>{new Date(0, m - 1).toLocaleString("default", { month: "long" })}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Year</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-gray-700"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {timePeriod === "quarterly" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Quarter</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1,2,3,4].map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setSelectedQuarter(q)}
                        className={`px-3 py-2 rounded-lg font-semibold border ${selectedQuarter === q ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200"}`}
                      >
                        Q{q}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Year</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-gray-700"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {timePeriod === "yearly" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6"
              >
                <label className="block text-sm font-bold text-gray-700 mb-2">Year</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-gray-700"
                />
              </motion.div>
            )}
          </AnimatePresence>



          {/* Custom Date Range */}
          <AnimatePresence>
            {showCustomDate && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t-2 border-purple-100"
              >
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => handleDateChange("start", e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-xl">📅</span>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => handleDateChange("end", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 bg-gradient-to-r from-indigo-50 to-purple-50 focus:ring-4 focus:ring-indigo-100 outline-none transition-all font-semibold text-gray-700 ${
                      dateError
                        ? "border-red-500 focus:border-red-500"
                        : "border-indigo-200 focus:border-indigo-500"
                    }`}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Date Validation Error */}
          <AnimatePresence>
            {dateError && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="mt-4 px-4 py-3 rounded-xl bg-red-50 border-2 border-red-300"
              >
                <p className="text-red-700 font-semibold flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  {dateError}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-4 mb-8 overflow-x-auto pb-2"
        >
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-white shadow-xl transition-all ${
                activeTab === tab.id
                  ? `bg-gradient-to-r ${tab.color} ring-4 ring-offset-2 ring-purple-300`
                  : "bg-gradient-to-r from-gray-400 to-gray-500 hover:from-gray-500 hover:to-gray-600"
              }`}
            >
              <span className="text-2xl">{tab.icon}</span>
              <span className="whitespace-nowrap">{tab.label}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Analytics;
