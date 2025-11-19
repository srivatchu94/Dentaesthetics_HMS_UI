import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import TabCard from "../components/TabCard";

const CRUD = ["Add Clinic", "List Clinics", "Update Clinic", "Delete Clinic"];

export default function Clinics(){
  const [log, setLog] = useState([]);
  const navigate = useNavigate();
  const onAction = (a) => {
    if (a === "Add Clinic") { navigate("/clinics/create"); return; }
    if (a === "List Clinics") { navigate("/clinics/view"); return; }
    setLog((s) => [a, ...s].slice(0, 10));
    alert(`${a} (sample)`);
  };

  return (
    <div className="space-y-4">
      <TabCard title="Clinics - Quick Actions" items={CRUD} onAction={onAction} />
      
      {/* Reports & Analytics Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-teal-50 via-purple-50 to-coral-50 rounded-xl shadow-lg p-6 border border-teal-200"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-teal-700 via-purple-700 to-coral-700 bg-clip-text text-transparent mb-2">
              📊 Reports & Analytics Dashboard
            </h3>
            <p className="text-slate-600 text-sm">
              View revenue trends, patient flow, performance metrics, and generate comprehensive reports
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/reports")}
            className="px-6 py-3 bg-gradient-to-r from-teal-500 via-purple-500 to-coral-500 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all"
          >
            View Dashboard →
          </motion.button>
        </div>
      </motion.div>

      <div className="card">
        <h3 className="font-semibold mb-2">Activity</h3>
        <ul className="list-disc pl-5 text-sm">
          {log.length === 0 ? <li>No activity yet</li> : log.map((l,i)=><li key={i}>{l}</li>)}
        </ul>
      </div>
    </div>
  );
}
