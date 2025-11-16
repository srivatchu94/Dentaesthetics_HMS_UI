import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [activeTab, setActiveTab] = useState("mission");

  const goals = {
    mission: {
      title: "Our Mission",
      icon: "🎯",
      content: "To provide comprehensive and compassionate dental care through innovative technology, making healthcare management seamless for practitioners and accessible for patients.",
      points: [
        "Deliver exceptional patient care through digital transformation",
        "Empower dental professionals with efficient management tools",
        "Ensure data security and privacy in all operations",
        "Foster continuous improvement in dental healthcare delivery"
      ]
    },
    vision: {
      title: "Our Vision",
      icon: "✨",
      content: "To be the leading dental healthcare management platform, revolutionizing how dental practices operate and enhancing patient experiences worldwide.",
      points: [
        "Seamless integration across all dental practice operations",
        "Patient-centered care with personalized health tracking",
        "Data-driven insights for better clinical outcomes",
        "A connected ecosystem of dental health professionals"
      ]
    },
    values: {
      title: "Our Values",
      icon: "💎",
      content: "We are guided by principles that ensure excellence, integrity, and innovation in everything we do.",
      points: [
        "Excellence: Committed to the highest standards of quality",
        "Integrity: Transparent and ethical in all interactions",
        "Innovation: Embracing technology for better healthcare",
        "Compassion: Putting patients and practitioners first"
      ]
    },
    commitment: {
      title: "Our Commitment",
      icon: "🤝",
      content: "Dedicated to supporting dental practices with reliable, user-friendly technology that enhances both efficiency and patient care quality.",
      points: [
        "24/7 technical support for uninterrupted service",
        "Regular updates and feature enhancements",
        "Comprehensive training and onboarding assistance",
        "Secure, HIPAA-compliant data management"
      ]
    }
  };

  const features = [
    { 
      icon: "🏥", 
      title: "Clinic Management", 
      description: "Streamline operations across multiple locations with centralized control",
      color: "from-teal-400/20 to-cyan-400/20",
      textColor: "text-teal-700"
    },
    { 
      icon: "👥", 
      title: "Patient Care", 
      description: "Comprehensive records and personalized treatment tracking",
      color: "from-blue-400/20 to-indigo-400/20",
      textColor: "text-blue-700"
    },
    { 
      icon: "🛠️", 
      title: "Service Organization", 
      description: "Manage treatments, procedures, and pricing efficiently",
      color: "from-purple-400/20 to-violet-400/20",
      textColor: "text-purple-700"
    },
    { 
      icon: "👔", 
      title: "Staff Coordination", 
      description: "Optimize team management and scheduling seamlessly",
      color: "from-rose-400/20 to-pink-400/20",
      textColor: "text-rose-700"
    },
  ];

  // Pricing tiers & payment schemas
  const [billingCycle, setBillingCycle] = useState("monthly");
  const pricingTiers = [
    {
      key: "starter",
      name: "Starter",
      icon: "🌱",
      monthly: 49,
      yearly: 39,
      blurb: "For solo practitioners launching digital ops",
      features: ["1 Clinic", "Up to 5 Staff", "1000 Patient Records", "Basic Reports"],
      accent: "from-teal-500 to-cyan-600"
    },
    {
      key: "growth",
      name: "Growth",
      icon: "🧭",
      monthly: 99,
      yearly: 79,
      blurb: "Multi-location teams scaling operations",
      features: ["Up to 3 Clinics", "30 Staff", "Unlimited Patients", "Advanced Analytics", "Priority Email Support"],
      accent: "from-blue-600 to-indigo-600"
    },
    {
      key: "pro",
      name: "Pro",
      icon: "🚀",
      monthly: 199,
      yearly: 159,
      blurb: "Established networks needing deeper insight",
      features: ["Up to 8 Clinics", "100 Staff", "Unlimited Patients", "Predictive Insights", "24/7 Priority Support"],
      accent: "from-purple-600 to-violet-600"
    },
    {
      key: "enterprise",
      name: "Enterprise",
      icon: "🏛️",
      monthly: 349,
      yearly: 279,
      blurb: "Large groups with custom governance",
      features: ["Unlimited Clinics", "Unlimited Staff", "SLA & Dedicated CSM", "Custom Integrations", "On-Prem / Hybrid Options"],
      accent: "from-rose-600 to-pink-600"
    }
  ];

  const addons = [
    { name: "AI Treatment Analytics", price: 59, icon: "🧠" },
    { name: "Tele-Dentistry Module", price: 79, icon: "📹" },
    { name: "Insurance E-Claim Bridge", price: 39, icon: "📄" },
    { name: "HIPAA Audit Trail Export", price: 25, icon: "🔐" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/30">
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        
        {/* Hero Section - Compact & Calming */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-gradient-to-br from-white/80 via-blue-50/50 to-teal-50/50 backdrop-blur-sm rounded-2xl shadow-lg border border-blue-100/50 p-8"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-blue-600 rounded-2xl shadow-lg mb-4"
            >
              <span className="text-3xl">🦷</span>
            </motion.div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-teal-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent mb-3">
              Dentaesthetics VitalsVille
            </h1>
            <p className="text-base text-slate-600 max-w-2xl mx-auto leading-relaxed mb-6">
              Transforming dental practice management with intuitive technology designed for excellence in patient care
            </p>
            <div className="flex gap-4 justify-center items-center">
              <Link to="/doctors">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                >
                  <span className="text-xl">👨‍⚕️</span>
                  <span>Access Doctor's Space</span>
                </motion.button>
              </Link>
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="w-2 h-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Goals Section - Sequential Cards */}
        <div className="space-y-6">
          {Object.entries(goals).map(([key, goal], index) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.6, 
                delay: 0.2 + index * 0.15,
                type: "spring",
                stiffness: 100
              }}
              whileHover={{ 
                scale: 1.02, 
                y: -5,
                transition: { duration: 0.3 }
              }}
              className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200/50 p-6 hover:shadow-2xl hover:border-teal-200/50 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <motion.span 
                  className="text-4xl"
                  whileHover={{ 
                    scale: 1.2, 
                    rotate: [0, -10, 10, -10, 0],
                    transition: { duration: 0.5 }
                  }}
                >
                  {goal.icon}
                </motion.span>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{goal.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{goal.content}</p>
                  <ul className="space-y-2">
                    {goal.points.map((point, idx) => (
                      <motion.li
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.15 + idx * 0.05 }}
                        className="flex items-start gap-3 text-sm text-slate-700"
                      >
                        <span className="text-teal-500 mt-0.5">✓</span>
                        <span>{point}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Features Grid - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-slate-800 mb-4 text-center">Core Capabilities</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature, idx) => (
              <Link
                key={idx}
                to={feature.title === "Clinic Management" ? "/clinics" : 
                    feature.title === "Patient Care" ? "/patients" : 
                    feature.title === "Service Organization" ? "/services" : "/staff"}
              >
                <motion.div
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={`bg-gradient-to-br ${feature.color} backdrop-blur-sm rounded-xl p-5 border border-white/50 shadow-sm hover:shadow-md transition-all cursor-pointer`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{feature.icon}</div>
                    <div className="flex-1">
                      <h3 className={`text-base font-bold ${feature.textColor} mb-1`}>{feature.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Quick Access - Compact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-6 border border-slate-200/50"
        >
          <h3 className="text-lg font-bold text-slate-800 mb-4 text-center">Quick Access</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Clinics", icon: "🏥", path: "/clinics", color: "from-teal-500 to-cyan-600" },
              { label: "Patients", icon: "👥", path: "/patients", color: "from-blue-500 to-indigo-600" },
              { label: "Doctors", icon: "👨‍⚕️", path: "/doctors", color: "from-cyan-500 to-teal-600" },
              { label: "Services", icon: "🛠️", path: "/services", color: "from-purple-500 to-violet-600" },
              { label: "Staff", icon: "👔", path: "/staff", color: "from-rose-500 to-pink-600" },
            ].map((link, idx) => (
              <Link
                key={idx}
                to={link.path}
              >
                <motion.div
                  whileHover={{ scale: 1.05, y: -3 }}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-center cursor-pointer"
                >
                  <div className={`w-12 h-12 mx-auto mb-2 bg-gradient-to-br ${link.color} rounded-xl flex items-center justify-center text-2xl shadow-md`}>
                    {link.icon}
                  </div>
                  <p className="text-xs font-semibold text-slate-700">{link.label}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Payment Schemas / Pricing */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="bg-gradient-to-br from-white/80 via-teal-50/50 to-blue-50/50 backdrop-blur-sm rounded-2xl shadow-lg border border-teal-100/60 p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">Subscription & Payment Options</h2>
              <p className="text-sm text-slate-600 mt-1">Flexible models to match clinic scale & evolution.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${billingCycle==='monthly' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`} onClick={()=>setBillingCycle('monthly')}>Monthly</span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${billingCycle==='yearly' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-700'}`} onClick={()=>setBillingCycle('yearly')}>Yearly <span className="text-[10px] font-normal">(save ~20%)</span></span>
            </div>
          </div>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
            {pricingTiers.map((tier, i) => (
              <motion.div
                key={tier.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + i * 0.1 }}
                className="relative group bg-white rounded-xl shadow-md border border-slate-200 p-5 flex flex-col"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tier.accent} text-white flex items-center justify-center text-2xl shadow-md mb-3 group-hover:scale-110 transition`}>{tier.icon}</div>
                <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">{tier.name}</h3>
                <p className="text-xs text-slate-500 mb-3 leading-relaxed">{tier.blurb}</p>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold bg-gradient-to-r from-teal-600 to-indigo-600 bg-clip-text text-transparent">
                    ${billingCycle === 'monthly' ? tier.monthly : tier.yearly}
                  </span>
                  <span className="text-xs text-slate-500 ml-1">/ {billingCycle}</span>
                </div>
                <ul className="space-y-2 text-xs flex-1">
                  {tier.features.map((f, idx)=>(
                    <li key={idx} className="flex items-start gap-2 text-slate-600">
                      <span className="text-teal-500">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <button className="mt-5 w-full text-xs font-semibold px-3 py-2 rounded-lg bg-gradient-to-r from-teal-600 via-blue-600 to-indigo-600 text-white hover:shadow-lg hover:from-teal-700 hover:via-blue-700 hover:to-indigo-700 transition">
                  Choose {tier.name}
                </button>
                {tier.key === 'enterprise' && (
                  <span className="absolute top-2 right-2 text-[10px] px-2 py-1 rounded-full bg-rose-100 text-rose-700 font-semibold">Customizable</span>
                )}
              </motion.div>
            ))}
          </div>

          {/* Payment Schema Explanation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><span>🔁</span>Subscription</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Flat recurring fee per cycle. Tier scales with clinics, staff and advanced analytics capacity.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><span>📊</span>Usage-Based</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Optional metered modules (tele-dentistry minutes, AI inference credits) billed as add-ons.</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2"><span>🧩</span>Add-Ons</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Choose specialised capabilities when needed without upgrading entire tier.</p>
            </div>
          </div>

          {/* Add-ons */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 mb-4">Popular Add-Ons</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {addons.map((a,i)=>(
                <motion.div
                  key={a.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.05 }}
                  className="rounded-lg border border-slate-200 p-3 text-xs flex flex-col gap-2 hover:shadow-md hover:border-teal-300 transition bg-gradient-to-br from-slate-50 to-teal-50"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">{a.icon}</span>
                    <span className="font-semibold text-slate-700 leading-tight line-clamp-2">{a.name}</span>
                  </div>
                  <span className="text-teal-600 font-bold">${a.price}</span>
                  <button className="mt-auto text-[10px] font-semibold px-2 py-1 rounded-md bg-teal-600 text-white hover:bg-teal-700">Add</button>
                </motion.div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-3">Yearly pricing reflects effective per-month rate when billed annually.</p>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
