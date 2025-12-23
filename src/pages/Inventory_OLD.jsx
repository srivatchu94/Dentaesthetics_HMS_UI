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
        className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6"
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
            className="relative bg-white backdrop-blur-md rounded-2xl p-6 border-2 border-emerald-300 shadow-lg h-full flex flex-col justify-between"
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
            className="relative bg-white backdrop-blur-md rounded-2xl p-6 border-2 border-blue-300 shadow-lg h-full flex flex-col justify-between"
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

        {/* Suppliers Tile */}
        <motion.div
          variants={tileVariants}
          whileHover="hover"
          className="relative cursor-pointer group"
          onClick={() => setShowAddModal(true)}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-orange-200 via-amber-200 to-yellow-200 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition-all duration-300"></div>
          
          <motion.div
            whileHover={{ y: -10 }}
            className="relative bg-white backdrop-blur-md rounded-2xl p-4 border-2 border-orange-300 shadow-lg h-full flex flex-col justify-between"
          >
            <div>
              <motion.div
                variants={iconVariants}
                whileHover="hover"
                className="text-5xl mb-3 inline-block"
              >
                🚚
              </motion.div>
              
              <h2 className="text-2xl font-bold text-orange-900 mb-2">
                Suppliers Management
              </h2>
              
              <p className="text-gray-700 text-sm leading-relaxed mb-4">
                Add and manage supplier information including basic details, contact information, 
                and maintain supplier database for inventory ordering.
              </p>

              <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm">
                  <span className="text-lg">✓</span> Add supplier details
                </div>
                <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm">
                  <span className="text-lg">✓</span> Contact information
                </div>
                <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm">
                  <span className="text-lg">✓</span> Supplier database
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowAddModal(true);
              }}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 text-lg shadow-lg hover:shadow-xl"
            >
              Manage Suppliers
            </motion.button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>🚚</span> Add Supplier Information
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-white/80 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form className="space-y-6">
                {/* Basic Information Section */}
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-200 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
                    <span>📋</span> Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Supplier Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., MedSupply Co."
                        className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Supplier Code <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., SUP-001"
                        className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Company Address
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Enter supplier address"
                        className="w-full px-4 py-2 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <span>📞</span> Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Contact Person <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., John Doe"
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g., +1 234 567 8900"
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g., contact@medsupply.com"
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Website
                      </label>
                      <input
                        type="url"
                        placeholder="e.g., www.medsupply.com"
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Supplier information saved successfully! 🎉');
                      setShowAddModal(false);
                    }}
                    className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold rounded-lg transition shadow-lg"
                  >
                    💾 Save Supplier
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}

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
