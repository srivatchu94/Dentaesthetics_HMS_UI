import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TabCard from "../components/TabCard";

const CRUD = ["Add Staff", "List Staff", "Assign Role", "Remove Staff"];

export default function Staff(){
  const [log,setLog] = useState([]);
  const navigate = useNavigate();
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [staffForm, setStaffForm] = useState({
    name: "",
    specialty: "",
    staffType: "doctor",
    fixedSalary: "",
    effectiveDate: new Date().toISOString().split('T')[0],
    clinicId: "",
    // Added missing fields for backend
    licenseExpiry: "",
    yearsExperience: "",
    specialtyId: ""
  });

  const onAction = (a) => { 
    if (a === "Add Staff") {
      setShowAddStaffModal(true);
      return;
    }
    setLog(s => [a,...s].slice(0,10)); 
    alert(`${a} (sample)`); 
  };

  const handleAddStaff = () => {
    if (!staffForm.name || !staffForm.fixedSalary) {
      alert("Please fill in required fields (Name and Fixed Salary)");
      return;
    }
    
    // 🔍 DEBUG LOGGING - Check form values before sending
    console.log("=== STAFF FORM SUBMISSION DEBUG ===");
    console.log("Full Form Data:", staffForm);
    console.log("License Expiry:", staffForm.licenseExpiry, "Type:", typeof staffForm.licenseExpiry);
    console.log("Years Experience:", staffForm.yearsExperience, "Type:", typeof staffForm.yearsExperience);
    console.log("Specialty ID:", staffForm.specialtyId, "Type:", typeof staffForm.specialtyId);
    
    // Check if values are empty strings
    if (staffForm.licenseExpiry === "") console.warn("⚠️ License Expiry is empty string!");
    if (staffForm.yearsExperience === "") console.warn("⚠️ Years Experience is empty string!");
    if (staffForm.specialtyId === "") console.warn("⚠️ Specialty ID is empty string!");
    
    setLog(s => [`Added ${staffForm.name} with fixed salary ₹${parseFloat(staffForm.fixedSalary).toLocaleString('en-IN')} effective from ${staffForm.effectiveDate}`, ...s].slice(0,10));
    setShowAddStaffModal(false);
    setStaffForm({
      name: "",
      specialty: "",
      staffType: "doctor",
      fixedSalary: "",
      effectiveDate: new Date().toISOString().split('T')[0],
      clinicId: "",
      licenseExpiry: "",
      yearsExperience: "",
      specialtyId: ""
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 py-8">
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 mb-8"
      >
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-600 via-slate-700 to-slate-800 p-8 shadow-2xl">
          {/* Animated background blobs */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 90, 0],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              rotate: [90, 0, 90],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "linear"
            }}
            className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl"
          />
          
          <div className="relative z-10">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl font-bold text-white mb-3 flex items-center gap-4"
            >
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="text-6xl"
              >
                👥
              </motion.span>
              Staff Management Hub
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-emerald-50"
            >
              Manage staff members, roles, and operations efficiently
            </motion.p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-7xl mx-auto px-4 space-y-6">
        {/* Quick Actions Tiles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { id: 'add', title: '➕ Add Staff', description: 'Add new staff member', icon: '➕', color: 'from-emerald-400 to-teal-400', action: 'Add Staff' },
              { id: 'list', title: '📋 List Staff', description: 'View all staff', icon: '📋', color: 'from-teal-400 to-cyan-400', action: 'List Staff' },
              { id: 'assign', title: '🎭 Assign Role', description: 'Assign staff roles', icon: '🎭', color: 'from-cyan-400 to-blue-400', action: 'Assign Role' },
              { id: 'remove', title: '🗑️ Remove Staff', description: 'Remove staff member', icon: '🗑️', color: 'from-blue-400 to-indigo-400', action: 'Remove Staff' }
            ].map((tile, index) => (
              <motion.div
                key={tile.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setHoveredCard(tile.id)}
                onHoverEnd={() => setHoveredCard(null)}
                onClick={() => onAction(tile.action)}
                className="relative cursor-pointer group"
              >
                <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${tile.color} p-6 shadow-lg hover:shadow-2xl transition-all duration-300`}>
                  {/* Animated shine effect */}
                  <motion.div
                    animate={{
                      x: hoveredCard === tile.id ? ["-100%", "200%"] : "-100%",
                    }}
                    transition={{
                      duration: 0.6,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <motion.div
                      animate={{
                        rotate: hoveredCard === tile.id ? [0, -10, 10, -10, 0] : 0,
                      }}
                      transition={{ duration: 0.5 }}
                      className="text-5xl mb-3"
                    >
                      {tile.icon}
                    </motion.div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      {tile.title}
                    </h3>
                    <p className="text-white/90 text-sm">
                      {tile.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      
        {/* Salary Management Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 rounded-xl shadow-lg p-6 border border-amber-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="text-5xl"
              >
                💰
              </motion.div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-700 via-orange-700 to-red-700 bg-clip-text text-transparent mb-1">
                  Salary Management
                </h3>
                <p className="text-slate-600">
                  Calculate dentist salaries with fixed components and patient-based incentives
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/salary")}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Manage Salaries →
            </motion.button>
          </div>
        </motion.div>

        {/* Activity Log */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-lg p-6 border border-slate-200"
        >
          <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Recent Activity
          </h3>
          <ul className="space-y-2">
            {log.length === 0 ? (
              <li className="text-slate-500 italic">No activity yet</li>
            ) : (
              log.map((l, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 bg-slate-50 rounded-lg text-slate-700 border-l-4 border-teal-500"
                >
                  {l}
                </motion.li>
              ))
            )}
          </ul>
        </motion.div>
      </div>

      {/* Add Staff Modal */}
      <AnimatePresence>
        {showAddStaffModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddStaffModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-800">Add New Staff Member</h2>
                  <p className="text-sm text-slate-600">Enter staff details and set initial fixed salary</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddStaffModal(false)}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ✕
                </motion.button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Staff Name *
                    </label>
                    <input
                      type="text"
                      value={staffForm.name}
                      onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                      placeholder="Enter full name"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Specialty
                    </label>
                    <input
                      type="text"
                      value={staffForm.specialty}
                      onChange={(e) => setStaffForm({...staffForm, specialty: e.target.value})}
                      placeholder="e.g., Orthodontist"
                      className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                {/* 🆕 ADDED: Missing fields for backend */}
                <div className="grid grid-cols-3 gap-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 mb-2">
                      License Expiry Date
                    </label>
                    <input
                      type="date"
                      value={staffForm.licenseExpiry}
                      onChange={(e) => {
                        console.log("License Expiry changed to:", e.target.value);
                        setStaffForm({...staffForm, licenseExpiry: e.target.value});
                      }}
                      className="w-full px-4 py-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={staffForm.yearsExperience}
                      onChange={(e) => {
                        console.log("Years Experience changed to:", e.target.value);
                        setStaffForm({...staffForm, yearsExperience: e.target.value});
                      }}
                      placeholder="e.g., 5"
                      className="w-full px-4 py-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-blue-700 mb-2">
                      Specialty ID
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={staffForm.specialtyId}
                      onChange={(e) => {
                        console.log("Specialty ID changed to:", e.target.value);
                        setStaffForm({...staffForm, specialtyId: e.target.value});
                      }}
                      placeholder="e.g., 1"
                      className="w-full px-4 py-3 rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Staff Type
                  </label>
                  <select
                    value={staffForm.staffType}
                    onChange={(e) => setStaffForm({...staffForm, staffType: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-400 focus:border-transparent outline-none"
                  >
                    <option value="doctor">Doctor</option>
                    <option value="dentist">Dentist</option>
                    <option value="hygienist">Dental Hygienist</option>
                    <option value="assistant">Dental Assistant</option>
                  </select>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                    <span className="text-lg">💰</span>
                    Fixed Salary Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-emerald-700 mb-2">
                        Monthly Fixed Salary (₹) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        value={staffForm.fixedSalary}
                        onChange={(e) => setStaffForm({...staffForm, fixedSalary: e.target.value})}
                        placeholder="e.g., 150000"
                        className="w-full px-4 py-3 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none"
                      />
                      {staffForm.fixedSalary && (
                        <p className="text-xs text-emerald-600 mt-1">
                          ₹{parseFloat(staffForm.fixedSalary).toLocaleString('en-IN')} per month
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-emerald-700 mb-2">
                        Effective From Date *
                      </label>
                      <input
                        type="date"
                        value={staffForm.effectiveDate}
                        onChange={(e) => setStaffForm({...staffForm, effectiveDate: e.target.value})}
                        className="w-full px-4 py-3 rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-400 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAddStaffModal(false)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAddStaff}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
                >
                  ✓ Add Staff Member
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
