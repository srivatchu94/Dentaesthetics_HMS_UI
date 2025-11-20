import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Clinics(){
  const [log, setLog] = useState([]);
  const navigate = useNavigate();
  
  const onAction = (action) => {
    if (action === "Add Clinic") { navigate("/clinics/create"); return; }
    if (action === "List Clinics") { navigate("/clinics/view"); return; }
    setLog((s) => [action, ...s].slice(0, 10));
    alert(`${action} (sample)`);
  };

  const quickActions = [
    { 
      title: "Add Clinic", 
      icon: "➕", 
      description: "Register a new clinic location",
      color: "from-emerald-500 to-teal-500",
      bgColor: "from-emerald-50 to-teal-50",
      action: () => onAction("Add Clinic")
    },
    { 
      title: "List Clinics", 
      icon: "📋", 
      description: "View all registered clinics",
      color: "from-blue-500 to-cyan-500",
      bgColor: "from-blue-50 to-cyan-50",
      action: () => onAction("List Clinics")
    },
    { 
      title: "Update Clinic", 
      icon: "✏️", 
      description: "Modify clinic information",
      color: "from-amber-500 to-orange-500",
      bgColor: "from-amber-50 to-orange-50",
      action: () => onAction("Update Clinic")
    },
    { 
      title: "Delete Clinic", 
      icon: "🗑️", 
      description: "Remove clinic from system",
      color: "from-red-500 to-rose-500",
      bgColor: "from-red-50 to-rose-50",
      action: () => onAction("Delete Clinic")
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 rounded-xl shadow-2xl p-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Clinic Management</h1>
          <p className="text-blue-50 text-lg">Manage clinic locations, operations, and analytics</p>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Quick Actions Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <motion.div
                key={action.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onClick={action.action}
                className={`bg-gradient-to-br ${action.bgColor} rounded-xl shadow-lg hover:shadow-2xl transition-all cursor-pointer p-6 border border-slate-200 group`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-to-r ${action.color} flex items-center justify-center text-3xl mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 mb-2">{action.title}</h3>
                  <p className="text-sm text-slate-600">{action.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Reports & Analytics Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-50 via-pink-50 to-rose-50 rounded-xl shadow-lg p-8 border border-purple-200"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl shadow-lg">
                  📊
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-700 via-pink-700 to-rose-700 bg-clip-text text-transparent">
                  Reports & Analytics Dashboard
                </h3>
              </div>
              <p className="text-slate-600">
                View revenue trends, patient flow, performance metrics, and generate comprehensive reports across all clinics
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/reports")}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
            >
              View Dashboard →
            </motion.button>
          </div>
        </motion.div>

        {/* Salary Management Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-xl shadow-lg p-8 border border-emerald-200"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 flex items-center justify-center text-2xl shadow-lg">
                  💰
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent">
                  Salary Management
                </h3>
              </div>
              <p className="text-slate-600">
                Calculate and manage staff salaries, incentives, and payment records across all clinic locations
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/salary")}
              className="px-8 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
            >
              Manage Salaries →
            </motion.button>
          </div>
        </motion.div>

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📝</span> Recent Activity
          </h3>
          <AnimatePresence mode="popLayout">
            {log.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-8 text-slate-500"
              >
                <div className="text-5xl mb-3">📭</div>
                <p>No recent activity</p>
              </motion.div>
            ) : (
              <ul className="space-y-2">
                {log.map((item, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-gray-50 rounded-lg border border-slate-200 hover:border-teal-300 transition-all"
                  >
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500"></div>
                    <span className="text-slate-700 font-medium">{item}</span>
                    <span className="text-xs text-slate-500 ml-auto">Just now</span>
                  </motion.li>
                ))}
              </ul>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
