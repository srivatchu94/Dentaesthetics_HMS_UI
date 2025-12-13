import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Inventory() {
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const tileVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    },
    hover: {
      scale: 1.05,
      boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
      transition: { duration: 0.3 }
    }
  };

  const iconVariants = {
    hover: {
      rotate: 360,
      transition: { duration: 0.6 }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-16 text-center"
      >
        <h1 className="text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
          📦 Inventory Management System
        </h1>
        <p className="text-xl text-gray-600">
          Manage your master inventory and clinic-specific stocks seamlessly
        </p>
      </motion.div>

      {/* Tiles Container */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Add Master Inventory Tile */}
        <motion.div
          variants={tileVariants}
          whileHover="hover"
          className="relative cursor-pointer group"
          onClick={() => navigate('/inventory/add-master')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 via-teal-200 to-cyan-200 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-all duration-300"></div>
          
          <motion.div
            whileHover={{ y: -10 }}
            className="relative bg-white backdrop-blur-md rounded-2xl p-10 border-2 border-emerald-300 shadow-lg h-full flex flex-col justify-between"
          >
            <div>
              <motion.div
                variants={iconVariants}
                whileHover="hover"
                className="text-7xl mb-6 inline-block"
              >
                ➕
              </motion.div>
              
              <h2 className="text-3xl font-bold text-emerald-900 mb-3">
                Add Master Inventory
              </h2>
              
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Create and manage your master inventory items. Define item names, categories, 
                SKUs, units, and other essential details.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3 text-emerald-700 font-semibold">
                  <span className="text-2xl">✓</span> Add multiple items at once
                </div>
                <div className="flex items-center gap-3 text-emerald-700 font-semibold">
                  <span className="text-2xl">✓</span> Categorize and organize
                </div>
                <div className="flex items-center gap-3 text-emerald-700 font-semibold">
                  <span className="text-2xl">✓</span> Define units and SKUs
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/inventory/add-master');
              }}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
            >
              Add Inventory Items
            </motion.button>
          </motion.div>
        </motion.div>

        {/* View Master Inventory Tile */}
        <motion.div
          variants={tileVariants}
          whileHover="hover"
          className="relative cursor-pointer group"
          onClick={() => navigate('/inventory/view-master')}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-200 via-indigo-200 to-purple-200 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-all duration-300"></div>
          
          <motion.div
            whileHover={{ y: -10 }}
            className="relative bg-white backdrop-blur-md rounded-2xl p-10 border-2 border-blue-300 shadow-lg h-full flex flex-col justify-between"
          >
            <div>
              <motion.div
                variants={iconVariants}
                whileHover="hover"
                className="text-7xl mb-6 inline-block"
              >
                📋
              </motion.div>
              
              <h2 className="text-3xl font-bold text-blue-900 mb-3">
                View Master Inventory
              </h2>
              
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                Browse all master inventory items, search by name, edit details, and manage 
                your product catalog with ease.
              </p>

              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-3 text-blue-700 font-semibold">
                  <span className="text-2xl">✓</span> View all items
                </div>
                <div className="flex items-center gap-3 text-blue-700 font-semibold">
                  <span className="text-2xl">✓</span> Edit item details
                </div>
                <div className="flex items-center gap-3 text-blue-700 font-semibold">
                  <span className="text-2xl">✓</span> Search and filter
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                navigate('/inventory/view-master');
              }}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
            >
              View Inventory Items
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Features Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-20 max-w-4xl mx-auto"
      >
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl">
          <h3 className="text-2xl font-bold mb-6">Additional Features Available:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">🏥</span>
              <div>
                <h4 className="font-bold text-lg">Clinic Inventory Management</h4>
                <p className="text-purple-100">Add and manage inventory per clinic with enterprise filtering</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-3xl">📊</span>
              <div>
                <h4 className="font-bold text-lg">Real-time Analytics</h4>
                <p className="text-purple-100">Track stock levels and inventory statistics</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-3xl">🔄</span>
              <div>
                <h4 className="font-bold text-lg">Bulk Operations</h4>
                <p className="text-purple-100">Add or update multiple items efficiently</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-3xl">🔍</span>
              <div>
                <h4 className="font-bold text-lg">Advanced Search</h4>
                <p className="text-purple-100">Find items quickly by name, SKU, or category</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
