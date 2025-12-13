import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { request } from '../services/apiClient';

/**
 * @typedef {Object} InventoryMasterItem
 * @property {number} [itemId]
 * @property {string} itemName
 * @property {string} itemCode
 * @property {string} category
 * @property {string} subCategory
 * @property {string} unit
 * @property {boolean} isActive
 * @property {string} [createdAt]
 * @property {string} [updatedAt]
 */

const colorGradients = {
  'Supplies': 'from-blue-400 via-blue-500 to-blue-600',
  'Medication': 'from-red-400 via-red-500 to-red-600',
  'Materials': 'from-purple-400 via-purple-500 to-purple-600',
  'Equipment': 'from-orange-400 via-orange-500 to-orange-600',
  'Consumables': 'from-green-400 via-green-500 to-green-600',
};

const cardGradients = {
  'Supplies': 'from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100',
  'Medication': 'from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100',
  'Materials': 'from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100',
  'Equipment': 'from-orange-50 to-amber-50 hover:from-orange-100 hover:to-amber-100',
  'Consumables': 'from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100',
};

const borderGradients = {
  'Supplies': 'border-blue-300',
  'Medication': 'border-red-300',
  'Materials': 'border-purple-300',
  'Equipment': 'border-orange-300',
  'Consumables': 'border-green-300',
};

const textColors = {
  'Supplies': 'text-blue-700',
  'Medication': 'text-red-700',
  'Materials': 'text-purple-700',
  'Equipment': 'text-orange-700',
  'Consumables': 'text-green-700',
};

const accentColors = {
  'Supplies': 'from-blue-400 to-blue-600',
  'Medication': 'from-red-400 to-red-600',
  'Materials': 'from-purple-400 to-purple-600',
  'Equipment': 'from-orange-400 to-orange-600',
  'Consumables': 'from-green-400 to-green-600',
};

const categoryIcons = {
  'Supplies': '📦',
  'Medication': '💊',
  'Materials': '🧬',
  'Equipment': '⚙️',
  'Consumables': '🛠️',
};

export default function ViewMasterInventory() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editFormData, setEditFormData] = useState(null);
  const [editErrors, setEditErrors] = useState({});

  const categories = ['Supplies', 'Medication', 'Materials', 'Equipment', 'Consumables'];
  const subCategories = {
    'Supplies': ['Protective Gear', 'Cleaning Supplies', 'Gloves', 'Masks'],
    'Medication': ['Anesthetics', 'Antibiotics', 'Pain Relievers', 'Fluoride'],
    'Materials': ['Composites', 'Cements', 'Adhesives', 'Crowns'],
    'Equipment': ['Drills', 'Scalers', 'Mirrors', 'Chairs'],
    'Consumables': ['Bibs', 'Cups', 'Tips', 'Suction']
  };
  const units = ['Box', 'Tablet', 'Piece', 'Bottle', 'Pack', 'Set', 'Carton', 'Unit'];

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await request('/inventory/GetAllInventoryMasterItems');
      setItems(data || []);
    } catch (error) {
      console.error('Error loading inventory:', error);
      alert(`Error: ${error?.message || 'Failed to load inventory'}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.itemCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditFormData({ ...item });
    setEditErrors({});
    setShowEditModal(true);
  };

  const validateEditForm = () => {
    const errors = {};

    if (!editFormData?.itemName.trim()) errors.itemName = 'Item name is required';
    if (!editFormData?.itemCode.trim()) errors.itemCode = 'Item code/SKU is required';
    if (!editFormData?.category) errors.category = 'Category is required';
    if (!editFormData?.unit) errors.unit = 'Unit is required';

    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!validateEditForm()) return;

    try {
      // Call UpdateInventoryMasterItem API with InventoryMaster model
      const inventoryMasterModel = {
        itemId: editFormData?.itemId,
        itemName: editFormData?.itemName,
        itemCode: editFormData?.itemCode,
        category: editFormData?.category,
        subCategory: editFormData?.subCategory,
        unit: editFormData?.unit,
        isActive: editFormData?.isActive
      };

      await request('/inventory/UpdateInventoryMasterItem', {
        method: 'POST',
        body: JSON.stringify(inventoryMasterModel)
      });
      
      setItems(items.map(item => 
        item.itemId === editFormData?.itemId ? editFormData : item
      ));

      setSuccessMessage('✨ Inventory item updated successfully');
      setShowSuccessModal(true);
      setShowEditModal(false);

      setTimeout(() => {
        setShowSuccessModal(false);
        loadInventory();
      }, 2000);
    } catch (error) {
      alert(`Error: ${error?.message || 'Failed to update item'}`);
    }
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await request(`/inventory/DeleteInventoryMaster/${selectedItem?.itemId}`, {
        method: 'DELETE'
      });

      setItems(items.filter(item => item.itemId !== selectedItem?.itemId));

      setSuccessMessage('Inventory item deleted successfully');
      setShowSuccessModal(true);
      setShowDeleteModal(false);

      setTimeout(() => {
        setShowSuccessModal(false);
        loadInventory();
      }, 2000);
    } catch (error) {
      alert(`Error: ${error?.message || 'Failed to delete item'}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 flex items-center gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/inventory')}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-lg shadow-lg"
        >
          ← Back
        </motion.button>
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            📋 Master Inventory Items
          </h1>
          <p className="text-gray-600 mt-2">Total: {filteredItems.length} items</p>
        </div>
      </motion.div>

      {/* Search and Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-blue-200"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">🔍 Search by Name or SKU</label>
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">📂 Filter by Category</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center items-center py-12"
        >
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="text-5xl mb-4"
            >
              ⏳
            </motion.div>
            <p className="text-xl text-gray-600 font-semibold">Loading inventory...</p>
          </div>
        </motion.div>
      )}

      {/* Items Grid */}
      {!loading && filteredItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          <AnimatePresence>
            {filteredItems.map((item, index) => {
              const gradientBg = cardGradients[item.category] || 'from-gray-50 to-gray-100';
              const borderColor = borderGradients[item.category] || 'border-gray-300';
              const textColor = textColors[item.category] || 'text-gray-700';
              const accentGradient = accentColors[item.category] || 'from-gray-400 to-gray-600';
              const icon = categoryIcons[item.category] || '📦';

              return (
                <motion.div
                  key={item.itemId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.03, y: -8 }}
                  className="relative group h-full"
                >
                  {/* Decorative Background Elements */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradientBg} rounded-2xl transition-all duration-300`}></div>

                  {/* Subtle Accent Line */}
                  <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${accentGradient} rounded-t-2xl`}></div>

                  {/* Card Content */}
                  <div className={`relative bg-gradient-to-br ${gradientBg} rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 h-full flex flex-col border-2 ${borderColor} overflow-hidden`}>
                    {/* Decorative Corner Element */}
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${accentGradient} opacity-5 rounded-full -mr-16 -mt-16 group-hover:opacity-10 transition-opacity duration-300`}></div>

                    {/* Status Badge */}
                    <div className="absolute top-4 right-4 z-20">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm ${
                        item.isActive 
                          ? `bg-gradient-to-r ${accentGradient} text-white` 
                          : 'bg-gray-300/50 text-gray-700'
                      }`}>
                        {item.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>

                    {/* Icon */}
                    <motion.div 
                      className="text-5xl mb-4"
                      whileHover={{ scale: 1.2, rotate: 5 }}
                    >
                      {icon}
                    </motion.div>

                    {/* Item Name */}
                    <h3 className={`text-2xl font-bold mb-3 truncate ${textColor}`}>
                      {item.itemName}
                    </h3>

                    {/* Details */}
                    <div className="space-y-2 mb-6 flex-grow">
                      <div className={`flex items-center gap-2 ${textColor}`}>
                        <span className="font-semibold text-sm">SKU:</span>
                        <span className={`bg-gradient-to-r ${accentGradient} bg-opacity-10 px-2 py-1 rounded text-sm font-medium`}>
                          {item.itemCode}
                        </span>
                      </div>
                      <div className={`flex items-center gap-2 ${textColor}`}>
                        <span className="font-semibold text-sm">Category:</span>
                        <span className={`bg-gradient-to-r ${accentGradient} bg-opacity-10 px-2 py-1 rounded text-sm font-medium`}>
                          {item.category}
                        </span>
                      </div>
                      {item.subCategory && (
                        <div className={`flex items-center gap-2 ${textColor}`}>
                          <span className="font-semibold text-sm">Sub:</span>
                          <span className={`bg-gradient-to-r ${accentGradient} bg-opacity-10 px-2 py-1 rounded text-sm font-medium`}>
                            {item.subCategory}
                          </span>
                        </div>
                      )}
                      <div className={`flex items-center gap-2 ${textColor}`}>
                        <span className="font-semibold text-sm">Unit:</span>
                        <span className={`bg-gradient-to-r ${accentGradient} bg-opacity-10 px-2 py-1 rounded text-sm font-medium`}>
                          {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 relative z-10">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleEditClick(item)}
                        className={`flex-1 bg-gradient-to-r ${accentGradient} hover:shadow-lg text-white font-bold py-3 px-4 rounded-lg transition-all`}
                      >
                        ✏️ Edit
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteClick(item)}
                        className="flex-1 bg-gradient-to-r from-red-400 to-red-500 hover:from-red-500 hover:to-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all hover:shadow-lg"
                      >
                        🗑️ Delete
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-bold text-gray-700 mb-2">No items found</h3>
          <p className="text-gray-600 mb-6">Try adjusting your search or filters</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            onClick={() => navigate('/inventory/add-master')}
            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl"
          >
            ➕ Add Items
          </motion.button>
        </motion.div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && editFormData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-6 border-b-4 border-blue-600">
                <h2 className="text-2xl font-bold">✏️ Edit Inventory Item</h2>
              </div>

              <div className="p-8 space-y-6">
                {/* Item Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Item Name *</label>
                  <input
                    type="text"
                    value={editFormData.itemName}
                    onChange={(e) => setEditFormData({ ...editFormData, itemName: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                      editErrors.itemName
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-blue-300 focus:ring-blue-400'
                    }`}
                  />
                  {editErrors.itemName && <p className="text-red-600 text-sm mt-1">{editErrors.itemName}</p>}
                </div>

                {/* Item Code */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Item Code/SKU *</label>
                  <input
                    type="text"
                    value={editFormData.itemCode}
                    onChange={(e) => setEditFormData({ ...editFormData, itemCode: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                      editErrors.itemCode
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-blue-300 focus:ring-blue-400'
                    }`}
                  />
                  {editErrors.itemCode && <p className="text-red-600 text-sm mt-1">{editErrors.itemCode}</p>}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Category *</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => {
                      setEditFormData({ ...editFormData, category: e.target.value, subCategory: '' });
                    }}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                      editErrors.category
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-blue-300 focus:ring-blue-400'
                    }`}
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {editErrors.category && <p className="text-red-600 text-sm mt-1">{editErrors.category}</p>}
                </div>

                {/* Sub Category */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Sub Category</label>
                  <select
                    value={editFormData.subCategory}
                    onChange={(e) => setEditFormData({ ...editFormData, subCategory: e.target.value })}
                    disabled={!editFormData.category}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:bg-gray-100"
                  >
                    <option value="">Select Sub Category</option>
                    {editFormData.category && subCategories[editFormData.category]?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Unit *</label>
                  <select
                    value={editFormData.unit}
                    onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                      editErrors.unit
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-blue-300 focus:ring-blue-400'
                    }`}
                  >
                    <option value="">Select Unit</option>
                    {units.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                  {editErrors.unit && <p className="text-red-600 text-sm mt-1">{editErrors.unit}</p>}
                </div>

                {/* Active Status */}
                <div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editFormData.isActive}
                      onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                      className="w-5 h-5 accent-blue-500"
                    />
                    <span className="font-semibold text-gray-700">Mark as Active</span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSaveEdit}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg"
                  >
                    ✅ Save Changes
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg"
                  >
                    ❌ Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md mx-auto p-8 border-4 border-red-500"
            >
              <div className="text-center">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Delete Item?</h2>
                <p className="text-gray-600 mb-2">
                  Are you sure you want to delete <strong>{selectedItem.itemName}</strong>?
                </p>
                <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>

                <div className="flex gap-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirmDelete}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg"
                  >
                    🗑️ Delete
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 bg-gray-400 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg"
                  >
                    ❌ Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-2xl p-8 shadow-2xl border-4 border-green-500 max-w-md mx-auto"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="text-6xl mb-4"
                >
                  ✅
                </motion.div>
                <h2 className="text-2xl font-bold text-green-600 mb-4">Success!</h2>
                <p className="text-gray-700 text-lg">{successMessage}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
