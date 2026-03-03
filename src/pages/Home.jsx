import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function Home() {
  const quickLinks = [
    { label: "Register Patient", icon: "📝", path: "/patients/register", color: "from-indigo-500 to-purple-600" },
    { label: "View Patients", icon: "👥", path: "/patients/view", color: "from-purple-500 to-pink-600" },
    { label: "Appointments", icon: "📆", path: "/calendar", color: "from-teal-500 to-cyan-600" },
    { label: "Clinic Management", icon: "🏥", path: "/clinics", color: "from-orange-500 to-red-600" },
    { label: "Staff Management", icon: "👔", path: "/staff", color: "from-blue-500 to-indigo-600" },
    { label: "Reports", icon: "📊", path: "/reports", color: "from-green-500 to-teal-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-12">
        
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 backdrop-blur-xl rounded-3xl shadow-2xl border border-indigo-400/30 p-12 relative overflow-hidden"
        >
          {/* Animated background elements */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full blur-3xl -z-0"
          />
          <motion.div
            animate={{ 
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 8, repeat: Infinity, delay: 2 }}
            className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full blur-3xl -z-0"
          />

          <div className="text-center relative z-10">
            {/* Professional Badge */}
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mb-4 shadow-lg"
            >
              <span className="text-sm font-bold text-white">✨ Dhantha - The Dental Company</span>
            </motion.div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent mb-4 drop-shadow-lg leading-tight">
              Healthcare Management System
            </h1>
            
            {/* Subtitle */}
            <p className="text-lg md:text-xl text-slate-200 max-w-3xl mx-auto leading-relaxed font-medium mb-6">
              Streamline patient care, appointments, staff coordination, and clinic operations all in one intuitive platform.
            </p>

            {/* Real-time Status Indicator */}
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="flex items-center justify-center gap-2 text-sm text-cyan-300 font-semibold"
            >
              <motion.div
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-2 h-2 bg-cyan-400 rounded-full"
              />
              <span>System Status: All Systems Operational</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Quick Links Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((link, idx) => (
              <Link
                key={idx}
                to={link.path}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 + idx * 0.1 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center hover:shadow-2xl hover:border-purple-300 transition-all cursor-pointer group"
                >
                  <motion.div
                    className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-br ${link.color} rounded-2xl flex items-center justify-center text-4xl shadow-md group-hover:scale-110 transition-transform`}
                  >
                    {link.icon}
                  </motion.div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{link.label}</h3>
                  <p className="text-slate-600 text-sm">Access now →</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
