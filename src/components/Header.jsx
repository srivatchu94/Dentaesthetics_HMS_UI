import React, { useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";

const TABS = [
  { key: "home", path: "/", label: "Home", bgColor: "from-rose-100 to-pink-100", textColor: "text-rose-800", borderColor: "border-rose-400", hoverBg: "hover:bg-rose-200", icon: "🏠" },
  { key: "clinics", path: "/clinics", label: "Clinics", bgColor: "from-emerald-100 to-teal-100", textColor: "text-emerald-800", borderColor: "border-emerald-400", hoverBg: "hover:bg-emerald-200", icon: "🏥" },
  { key: "patients", path: "/patients", label: "Patients", bgColor: "from-sky-100 to-cyan-100", textColor: "text-sky-800", borderColor: "border-sky-400", hoverBg: "hover:bg-sky-200", icon: "👥" },
  { key: "services", path: "/services", label: "Services", bgColor: "from-amber-100 to-orange-100", textColor: "text-amber-800", borderColor: "border-amber-400", hoverBg: "hover:bg-amber-200", icon: "🛠️" },
  { key: "staff", path: "/staff", label: "Staff", bgColor: "from-violet-100 to-purple-100", textColor: "text-violet-800", borderColor: "border-violet-400", hoverBg: "hover:bg-violet-200", icon: "👔" },
];

const CRUD_OPERATIONS = {
  home: [],
  clinics: ["create", "read", "update", "delete"],
  patients: ["create", "read", "update", "delete"],
  services: ["create", "read", "update", "delete"],
  staff: ["create", "read", "update", "delete"],
};

export default function Header(){
  const [hoveredTab, setHoveredTab] = useState(null);
  const navigate = useNavigate();

  const handleCrudClick = (tabKey, operation) => {
    navigate(`/${tabKey}/${operation}`);
  };

  return (
    <>
      <header className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] mb-0">
        <div className="bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 shadow-lg py-8 px-6 md:px-12 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="w-16 h-16 bg-white rounded-lg shadow-lg flex items-center justify-center font-bold text-2xl text-indigo-700">DV</div>
            <h1 className="text-4xl font-extrabold text-indigo-900">Dentaesthetics — VitalsVille</h1>
          </Link>

          <button className="px-8 py-3 bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-all font-bold shadow-lg hover:shadow-xl">
            Login
          </button>
        </div>
      </header>

      <nav className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200 shadow-md">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex gap-6 justify-center relative flex-wrap">
          {TABS.map((t) => (
            <div
              key={t.key}
              className="relative"
              onMouseEnter={() => setHoveredTab(t.key)}
              onMouseLeave={() => setHoveredTab(null)}
            >
              <NavLink
                to={t.path}
                className={({isActive}) =>
                  `px-6 py-3 font-bold transition-all inline-flex items-center gap-2 rounded-lg border-2 ${t.bgColor} ${t.textColor} ${t.borderColor} ${isActive ? `${t.hoverBg} ring-2 ring-offset-2 scale-105` : `${t.hoverBg}`}`
                }
              >
                <span className="text-2xl">{t.icon}</span>
                <motion.span whileHover={{ y: -2 }}>{t.label}</motion.span>
              </NavLink>

              {/* Dropdown Menu */}
              {hoveredTab === t.key && CRUD_OPERATIONS[t.key].length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-2xl overflow-hidden z-50 min-w-max border-2 border-slate-200 pointer-events-auto"
                  onMouseEnter={() => setHoveredTab(t.key)}
                  onMouseLeave={() => setHoveredTab(null)}
                >
                  {CRUD_OPERATIONS[t.key].map((op, idx) => {
                    const colors = {
                      create: { bg: "bg-green-50 hover:bg-green-100", text: "text-green-700", icon: "➕" },
                      read: { bg: "bg-blue-50 hover:bg-blue-100", text: "text-blue-700", icon: "👁️" },
                      update: { bg: "bg-yellow-50 hover:bg-yellow-100", text: "text-yellow-700", icon: "✏️" },
                      delete: { bg: "bg-red-50 hover:bg-red-100", text: "text-red-700", icon: "🗑️" },
                    };
                    const opColor = colors[op];

                    return (
                      <motion.button
                        key={op}
                        whileHover={{ x: 8 }}
                        onClick={() => {
                          handleCrudClick(t.key, op);
                          setHoveredTab(null);
                        }}
                        className={`w-full px-6 py-4 text-left font-semibold transition-all ${opColor.bg} ${opColor.text} ${idx !== CRUD_OPERATIONS[t.key].length - 1 ? 'border-b border-slate-200' : ''} flex items-center gap-3 cursor-pointer`}
                      >
                        <span className="text-xl">{opColor.icon}</span>
                        <span className="capitalize">{op}</span>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
