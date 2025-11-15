import React from "react";
import { motion } from "framer-motion";

export default function TabCard({ title, items = [], onAction }){
  return (
    <motion.div layout className="card">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((it) => (
          <button key={it} className="px-3 py-2 bg-slate-100 rounded hover:bg-slate-200 text-sm" onClick={() => onAction(it)}>
            {it}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
