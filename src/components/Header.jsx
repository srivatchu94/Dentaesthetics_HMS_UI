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
  clinics: ["create", "view", "update", "delete"],
  patients: ["create", "view", "update", "delete"],
  services: ["create", "view", "update", "delete"],
  staff: ["create", "view", "update", "delete"],
};

export default function Header(){
  const [hoveredTab, setHoveredTab] = useState(null);
  const navigate = useNavigate();

  const handleCrudClick = (tabKey, operation) => {
    // Direct link to patient registration form for "create" operation
    if (tabKey === "patients" && operation === "create") {
      navigate("/patients?view=register");
    } else if (tabKey === "patients" && operation === "view") {
      // Navigate to separate ViewPatients page
      navigate("/patients/view");
    } else if (tabKey === "patients" && operation === "update") {
      // Navigate to separate EditPatients page
      navigate("/patients/edit");
    } else if (tabKey === "clinics" && operation === "create") {
      // Navigate to bespoke CreateClinic page
      navigate("/clinics/create");
    } else if (tabKey === "clinics" && operation === "view") {
      navigate("/clinics/view");
    } else if (tabKey === "patients" && operation === "delete") {
      navigate("/patients/delete");
    } else {
      navigate(`/${tabKey}/${operation}`);
    }
  };

  return (
    <>
      <header className="w-full fixed top-0 left-0 right-0 z-40">
        <div className="bg-gradient-to-r from-amber-100 via-rose-100 to-orange-100 shadow-lg">
          <div className="bg-gradient-to-br from-amber-50/90 via-rose-50/80 to-orange-50/90 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-4">
              <div className="grid grid-cols-3 items-center">
            {/* Logo - Left */}
                <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 bg-gradient-to-br from-amber-400 via-rose-400 to-orange-400 rounded-xl shadow-lg flex items-center justify-center"
                  >
                    <span className="text-2xl">🦷</span>
                  </motion.div>
                </Link>

            {/* Title - Center */}
                <div className="text-center">
                  <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-700 via-rose-700 to-orange-700 bg-clip-text text-transparent">
                    Dentaesthetics VitalsVille
                  </h1>
                </div>

            {/* Login Button - Right */}
                <div className="flex justify-end">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-2 bg-gradient-to-r from-amber-500 via-rose-500 to-orange-500 text-white rounded-lg hover:from-amber-600 hover:via-rose-600 hover:to-orange-600 transition-all font-semibold shadow-lg hover:shadow-xl text-sm"
                  >
                    Login
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="h-20"></div>

      <nav className="w-full bg-gradient-to-r from-amber-50/50 via-rose-50/40 to-orange-50/50 border-b border-amber-200/30 shadow-sm sticky top-20 z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 md:px-12 py-4">
          <div className="flex gap-6 justify-center relative flex-wrap items-center">
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
                      view: { bg: "bg-blue-50 hover:bg-blue-100", text: "text-blue-700", icon: "📋" },
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
        </div>
      </nav>
    </>
  );
}
