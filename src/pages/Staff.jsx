import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import TabCard from "../components/TabCard";

const CRUD = ["Add Staff", "List Staff", "Assign Role", "Remove Staff"];

export default function Staff(){
  const [log,setLog] = useState([]);
  const navigate = useNavigate();
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: "",
    specialty: "",
    staffType: "doctor",
    fixedSalary: "",
    effectiveDate: new Date().toISOString().split('T')[0],
    clinicId: ""
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
    setLog(s => [`Added ${staffForm.name} with fixed salary ₹${parseFloat(staffForm.fixedSalary).toLocaleString('en-IN')} effective from ${staffForm.effectiveDate}`, ...s].slice(0,10));
    setShowAddStaffModal(false);
    setStaffForm({
      name: "",
      specialty: "",
      staffType: "doctor",
      fixedSalary: "",
      effectiveDate: new Date().toISOString().split('T')[0],
      clinicId: ""
    });
  };

  return (
    <div className="space-y-4">
      <TabCard title="Staff - Quick Actions" items={CRUD} onAction={onAction} />
      
      {/* Salary Management Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 rounded-xl shadow-lg p-6 border border-emerald-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 bg-clip-text text-transparent mb-2">
              💰 Salary Management
            </h3>
            <p className="text-slate-600 text-sm">
              Calculate dentist salaries with fixed components and patient-based incentives
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/salary")}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Manage Salaries →
          </motion.button>
        </div>
      </motion.div>

      <div className="card">
        <h3 className="font-semibold mb-2">Staff activity</h3>
        <ul className="list-disc pl-5 text-sm">
          {log.length===0 ? <li>No activity yet</li> : log.map((l,i)=><li key={i}>{l}</li>)}
        </ul>
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
