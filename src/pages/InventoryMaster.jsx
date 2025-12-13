import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  listInventoryMasters,
  createInventoryMaster,
  updateInventoryMaster,
  deleteInventoryMaster,
  searchInventoryMasters
} from '../services/inventoryService';

export default function InventoryMaster() {
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState({
    itemName: '',
    itemCode: '',
    category: '',
    subCategory: '',
    unit: '',
    isActive: true
  });
  const [newItem, setNewItem] = useState({
    itemName: '',
    itemCode: '',
    category: '',
    subCategory: '',
    unit: '',
    isActive: true
  });

  const categories = ['Supplies', 'Medication', 'Materials', 'Equipment', 'Consumables'];
  const units = ['Box', 'Tablet', 'Piece', 'Bottle', 'Pack', 'Set', 'Carton', 'Unit'];

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await listInventoryMasters();
      setInventoryItems(data);
    } catch (error) {
      console.error('Error loading inventory:', error);
      showError('Failed to load inventory items');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadInventory();
      return;
    }

    setLoading(true);
    try {
      const data = await searchInventoryMasters({
        itemName: searchTerm
      });
      setInventoryItems(data);
    } catch (error) {
      console.error('Error searching inventory:', error);
      showError('Failed to search inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createInventoryMaster({
        itemName: newItem.itemName,
        itemCode: newItem.itemCode,
        category: newItem.category,
        subCategory: newItem.subCategory,
        unit: newItem.unit,
        isActive: newItem.isActive
      });

      showSuccess('✨ Inventory item added successfully!');
      setShowAddModal(false);
      setNewItem({
        itemName: '',
        itemCode: '',
        category: '',
        subCategory: '',
        unit: '',
        isActive: true
      });
      loadInventory();
    } catch (error) {
      console.error('Error adding item:', error);
      showError('Failed to add inventory item');
    } finally {
      setLoading(false);
    }
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    if (!selectedItem?.itemId) return;

    setLoading(true);
    try {
      await updateInventoryMaster(selectedItem.itemId, {
        itemName: editingItem.itemName,
        itemCode: editingItem.itemCode,
        category: editingItem.category,
        subCategory: editingItem.subCategory,
        unit: editingItem.unit,
        isActive: editingItem.isActive
      });

      showSuccess('✨ Inventory item updated successfully!');
      setShowEditModal(false);
      loadInventory();
    } catch (error) {
      console.error('Error updating item:', error);
      showError('Failed to update inventory item');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem?.itemId) return;

    setLoading(true);
    try {
      await deleteInventoryMaster(selectedItem.itemId);
      showSuccess('💥 Inventory item deleted successfully!');
      setShowDeleteModal(false);
      loadInventory();
    } catch (error) {
      console.error('Error deleting item:', error);
      showError('Failed to delete inventory item');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item) => {
    setSelectedItem(item);
    setEditingItem({
      itemName: item.itemName,
      itemCode: item.itemCode,
      category: item.category,
      subCategory: item.subCategory,
      unit: item.unit,
      isActive: item.isActive
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 3000);
  };

  const showError = (message) => {
    alert(message);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl shadow-2xl p-8 mb-8">
          <h1 className="text-4xl font-bold text-white flex items-center gap-3">
            <span className="text-5xl">📦</span>
            Inventory Master
          </h1>
          <p className="text-emerald-100 mt-2">Manage master inventory items for your enterprise</p>
        </div>

        {/* Search & Action Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Item</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search by item name..."
                className="w-full px-4 py-2 border-2 border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-6 py-2 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
            >
              🔍 Search
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-2 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-md"
            >
              ➕ Add Item
            </button>
          </div>
        </motion.div>

        {/* Inventory Items Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl">⏳</div>
            <p className="text-gray-600 mt-4">Loading inventory...</p>
          </div>
        ) : inventoryItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-xl shadow-lg p-12 text-center"
          >
            <span className="text-6xl">📭</span>
            <p className="text-xl text-gray-600 mt-4">No inventory items found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all"
            >
              ➕ Create First Item
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {inventoryItems.map((item, index) => (
              <motion.div
                key={item.itemId}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden border-2 border-emerald-100"
              >
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
                  <h3 className="text-lg font-bold text-white">{item.itemName}</h3>
                  <p className="text-emerald-100 text-sm">SKU: {item.itemCode}</p>
                </div>

                <div className="p-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-xs font-semibold text-gray-600 uppercase">Category</span>
                      <p className="text-sm text-gray-700">{item.category}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-600 uppercase">Sub Category</span>
                      <p className="text-sm text-gray-700">{item.subCategory}</p>
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-gray-600 uppercase">Unit</span>
                      <p className="text-sm text-gray-700">{item.unit}</p>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <span className="text-xs font-semibold text-gray-600 uppercase">Status</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        item.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.isActive ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => openEditModal(item)}
                      className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-2 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-600 transition-all"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(item)}
                      className="flex-1 bg-gradient-to-r from-red-500 to-rose-600 text-white px-3 py-2 rounded-lg font-semibold hover:from-red-600 hover:to-rose-700 transition-all"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Add Item Modal */}
        <AnimatePresence>
          {showAddModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
              >
                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>➕</span> Add New Inventory Item
                  </h2>
                </div>

                <form onSubmit={handleAddItem} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
                      <input
                        type="text"
                        required
                        value={newItem.itemName}
                        onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })}
                        placeholder="e.g., Dental Gloves"
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Item Code (SKU) *</label>
                      <input
                        type="text"
                        required
                        value={newItem.itemCode}
                        onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })}
                        placeholder="e.g., DG-001"
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                      <select
                        required
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Sub Category</label>
                      <input
                        type="text"
                        value={newItem.subCategory}
                        onChange={(e) => setNewItem({ ...newItem, subCategory: e.target.value })}
                        placeholder="e.g., Protection"
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Unit *</label>
                      <select
                        required
                        value={newItem.unit}
                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Unit</option>
                        {units.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        checked={newItem.isActive}
                        onChange={(e) => setNewItem({ ...newItem, isActive: e.target.checked })}
                        className="w-5 h-5 text-blue-600 rounded"
                      />
                      <label className="text-sm font-semibold text-gray-700">Active</label>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Creating...' : '✨ Create Item'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Edit Item Modal */}
        <AnimatePresence>
          {showEditModal && selectedItem && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowEditModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full"
              >
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>✏️</span> Edit Inventory Item
                  </h2>
                </div>

                <form onSubmit={handleEditItem} className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Item ID (Read Only)</label>
                      <input
                        type="number"
                        value={selectedItem.itemId}
                        disabled
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Item Name *</label>
                      <input
                        type="text"
                        required
                        value={editingItem.itemName || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, itemName: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Item Code (SKU) *</label>
                      <input
                        type="text"
                        required
                        value={editingItem.itemCode || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, itemCode: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                      <select
                        required
                        value={editingItem.category || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Sub Category</label>
                      <input
                        type="text"
                        value={editingItem.subCategory || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, subCategory: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Unit *</label>
                      <select
                        required
                        value={editingItem.unit || ''}
                        onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="">Select Unit</option>
                        {units.map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 pt-6">
                      <input
                        type="checkbox"
                        checked={editingItem.isActive || false}
                        onChange={(e) => setEditingItem({ ...editingItem, isActive: e.target.checked })}
                        className="w-5 h-5 text-amber-600 rounded"
                      />
                      <label className="text-sm font-semibold text-gray-700">Active</label>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-6">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Updating...' : '💾 Update Item'}
                    </button>
                  </div>
                </form>
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDeleteModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
              >
                <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span>⚠️</span> Confirm Delete
                  </h2>
                </div>

                <div className="p-6">
                  <p className="text-gray-700 mb-4">
                    Are you sure you want to delete <strong>{selectedItem.itemName}</strong>?
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    This action cannot be undone. All clinic inventory associated with this item will be affected.
                  </p>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteConfirm}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-red-700 hover:to-rose-700 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Deleting...' : '🗑️ Delete'}
                    </button>
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
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <motion.div
                className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
              >
                <div className="text-6xl mb-4">✨</div>
                <p className="text-xl font-bold text-gray-800">{successMessage}</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
