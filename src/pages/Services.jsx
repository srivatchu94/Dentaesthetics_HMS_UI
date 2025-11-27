import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function Services(){
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);

  const serviceCategories = [
    {
      id: 'dental-services',
      title: "🦷 Dental Services",
      description: "Manage dental treatments and procedures",
      gradient: "from-slate-500 via-slate-600 to-slate-700",
      bgGradient: "from-slate-50 to-slate-100",
      options: [
        {
          id: 'add-service',
          title: "➕ Add Service",
          description: "Create new dental service",
          action: "add",
          icon: "✨",
          color: "from-slate-400 to-slate-500"
        },
        {
          id: 'list-services',
          title: "📋 List Services",
          description: "View all available services",
          action: "list",
          icon: "📊",
          color: "from-blue-400 to-blue-500"
        },
        {
          id: 'edit-service',
          title: "✏️ Edit Service",
          description: "Modify service details",
          action: "edit",
          icon: "🔧",
          color: "from-indigo-400 to-indigo-500"
        },
        {
          id: 'remove-service',
          title: "🗑️ Remove Service",
          description: "Delete service from system",
          action: "remove",
          icon: "❌",
          color: "from-rose-400 to-rose-500"
        }
      ]
    },
    {
      id: 'service-packages',
      title: "📦 Service Packages",
      description: "Bundle services into treatment packages",
      gradient: "from-emerald-500 via-teal-500 to-teal-600",
      bgGradient: "from-emerald-50 to-teal-50",
      options: [
        {
          id: 'create-package',
          title: "🎁 Create Package",
          description: "Design service bundles",
          action: "create-package",
          icon: "🌟",
          color: "from-emerald-400 to-teal-400"
        },
        {
          id: 'view-packages',
          title: "👁️ View Packages",
          description: "Browse treatment packages",
          action: "view-packages",
          icon: "📦",
          color: "from-teal-400 to-cyan-400"
        }
      ]
    },
    {
      id: 'pricing-management',
      title: "💰 Pricing Management",
      description: "Set and manage service pricing",
      gradient: "from-amber-500 via-orange-400 to-orange-500",
      bgGradient: "from-amber-50 to-orange-50",
      options: [
        {
          id: 'update-pricing',
          title: "💵 Update Pricing",
          description: "Modify service costs",
          action: "pricing",
          icon: "💎",
          color: "from-amber-400 to-orange-400"
        },
        {
          id: 'view-rates',
          title: "📈 View Rates",
          description: "Check current pricing",
          action: "rates",
          icon: "💰",
          color: "from-orange-400 to-orange-500"
        }
      ]
    }
  ];

  const handleServiceAction = (action) => {
    // Placeholder for service actions
    console.log(`Action: ${action}`);
    alert(`${action} - Feature coming soon! 🚀`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Animated Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
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
            className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"
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
                🦷
              </motion.span>
              Services Management Hub
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl text-cyan-50"
            >
              Manage dental services, packages, and pricing with ease
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Service Categories */}
      <div className="space-y-8">
        {serviceCategories.map((category, categoryIndex) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: categoryIndex * 0.1 }}
          >
            {/* Category Header */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${category.bgGradient} p-6 shadow-lg mb-4`}
            >
              <div className="relative z-10">
                <h2 className={`text-3xl font-bold bg-gradient-to-r ${category.gradient} bg-clip-text text-transparent mb-2`}>
                  {category.title}
                </h2>
                <p className="text-slate-600 text-lg">{category.description}</p>
              </div>
              
              {/* Decorative gradient orb */}
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br ${category.gradient} opacity-20 rounded-full blur-3xl`}
              />
            </motion.div>

            {/* Service Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {category.options.map((option, optionIndex) => (
                <motion.div
                  key={option.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: categoryIndex * 0.1 + optionIndex * 0.05 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onHoverStart={() => setHoveredCard(option.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  onClick={() => handleServiceAction(option.action)}
                  className="relative cursor-pointer group"
                >
                  <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${option.color} p-6 shadow-lg hover:shadow-2xl transition-all duration-300`}>
                    {/* Animated shine effect */}
                    <motion.div
                      animate={{
                        x: hoveredCard === option.id ? ["-100%", "200%"] : "-100%",
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
                          rotate: hoveredCard === option.id ? [0, -10, 10, -10, 0] : 0,
                        }}
                        transition={{ duration: 0.5 }}
                        className="text-5xl mb-3"
                      >
                        {option.icon}
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        {option.title}
                      </h3>
                      <p className="text-white/90 text-sm">
                        {option.description}
                      </p>
                    </div>

                    {/* Hover glow */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredCard === option.id ? 1 : 0 }}
                      className="absolute inset-0 bg-white/10 backdrop-blur-sm"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Stats/Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-purple-900 to-indigo-900 p-8 shadow-2xl"
      >
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
          className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"
        />
        
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-3 flex items-center gap-3">
            <span className="text-3xl">📊</span>
            Service Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="text-4xl mb-2">🦷</div>
              <div className="text-3xl font-bold text-white mb-1">42</div>
              <div className="text-cyan-200 text-sm">Active Services</div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="text-4xl mb-2">📦</div>
              <div className="text-3xl font-bold text-white mb-1">12</div>
              <div className="text-cyan-200 text-sm">Service Packages</div>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20"
            >
              <div className="text-4xl mb-2">💰</div>
              <div className="text-3xl font-bold text-white mb-1">₹2.5L</div>
              <div className="text-cyan-200 text-sm">Avg Monthly Revenue</div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Pro Tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-400 rounded-lg"
      >
        <p className="text-amber-900 flex items-center gap-2">
          <span className="text-2xl">💡</span>
          <span className="font-semibold">Pro Tip:</span>
          Bundle related services into packages to offer better value and increase patient satisfaction!
        </p>
      </motion.div>
    </div>
  );
}
