import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import TabCard from "../components/TabCard";

const CRUD = ["Add Staff", "List Staff", "Assign Role", "Remove Staff"];

export default function Staff(){
  const [log,setLog] = useState([]);
  const navigate = useNavigate();
  const onAction = (a) => { setLog(s => [a,...s].slice(0,10)); alert(`${a} (sample)`); };

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
    </div>
  );
}
