import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { request } from '../services/apiClient';

/**
 * @typedef {Object} InventoryMasterItem
 * @property {string} itemName
 * @property {string} itemCode
 * @property {string} category
 * @property {string} subCategory
 * @property {string} unit
 * @property {boolean} isActive
 */

export default function AddMasterInventory() {
  const navigate = useNavigate();
  const [items, setItems] = useState([
    {
      itemName: '',
      itemCode: '',
      category: '',
      subCategory: '',
      unit: '',
      isActive: true
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState({});

  const categories = ['Supplies', 'Medication', 'Materials', 'Equipment', 'Consumables'];
  const subCategories = {
    'Supplies': ['Protective Gear', 'Cleaning Supplies', 'Gloves', 'Masks'],
    'Medication': ['Anesthetics', 'Antibiotics', 'Pain Relievers', 'Fluoride'],
    'Materials': ['Composites', 'Cements', 'Adhesives', 'Crowns'],
    'Equipment': ['Drills', 'Scalers', 'Mirrors', 'Chairs'],
    'Consumables': ['Bibs', 'Cups', 'Tips', 'Suction']
  };
  const units = ['Box', 'Tablet', 'Piece', 'Bottle', 'Pack', 'Set', 'Carton', 'Unit'];

  const validateItem = (item, index) => {
    const itemErrors = {};

    if (!item.itemName.trim()) itemErrors.itemName = 'Item name is required';
    if (!item.itemCode.trim()) itemErrors.itemCode = 'Item code/SKU is required';
    if (!item.category) itemErrors.category = 'Category is required';
    if (!item.unit) itemErrors.unit = 'Unit is required';

    if (Object.keys(itemErrors).length > 0) {
      setErrors(prev => ({ ...prev, [index]: itemErrors }));
      return false;
    }

    setErrors(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
    return true;
  };

  const handleAddRow = () => {
    setItems([
      ...items,
      {
        itemName: '',
        itemCode: '',
        category: '',
        subCategory: '',
        unit: '',
        isActive: true
      }
    ]);
  };

  const handleRemoveRow = (index) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // Reset sub-category if category changes
    if (field === 'category') {
      updatedItems[index].subCategory = '';
    }

    setItems(updatedItems);
  };

  const handleSubmit = async () => {
    // Validate all items
    let isValid = true;
    for (let i = 0; i < items.length; i++) {
      if (!validateItem(items[i], i)) {
        isValid = false;
      }
    }

    if (!isValid) {
      alert('Please fix all errors before submitting');
      return;
    }

    setLoading(true);
    try {
      await request('/inventory/AddInventoryMasterItemsBulk', {
        method: 'POST',
        body: JSON.stringify(items)
      });

      setSuccessMessage(`Successfully added ${items.length} inventory item(s)`);
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/inventory/view-master');
      }, 2500);
    } catch (error) {
      alert(`Error: ${error?.message || 'Failed to add items'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-8">
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
          className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-lg"
        >
          ← Back
        </motion.button>
        <div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            ➕ Add Master Inventory Items
          </h1>
          <p className="text-gray-600 mt-2">Add multiple inventory items in bulk to your master catalog</p>
        </div>
      </motion.div>

      {/* Items Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl overflow-hidden border-2 border-emerald-300 mb-8"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                <th className="px-6 py-4 text-left font-bold">Item Name</th>
                <th className="px-6 py-4 text-left font-bold">SKU/Code</th>
                <th className="px-6 py-4 text-left font-bold">Category</th>
                <th className="px-6 py-4 text-left font-bold">Sub Category</th>
                <th className="px-6 py-4 text-left font-bold">Unit</th>
                <th className="px-6 py-4 text-left font-bold">Active</th>
                <th className="px-6 py-4 text-center font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`border-b-2 hover:bg-emerald-50 transition-colors ${
                      errors[index] ? 'bg-red-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="e.g., Composite Resin"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                          errors[index]?.itemName
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-emerald-300 focus:ring-emerald-400'
                        }`}
                      />
                      {errors[index]?.itemName && (
                        <p className="text-red-600 text-sm mt-1">{errors[index].itemName}</p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="e.g., CR-001"
                        value={item.itemCode}
                        onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                          errors[index]?.itemCode
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-emerald-300 focus:ring-emerald-400'
                        }`}
                      />
                      {errors[index]?.itemCode && (
                        <p className="text-red-600 text-sm mt-1">{errors[index].itemCode}</p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={item.category}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                          errors[index]?.category
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-emerald-300 focus:ring-emerald-400'
                        }`}
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {errors[index]?.category && (
                        <p className="text-red-600 text-sm mt-1">{errors[index].category}</p>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={item.subCategory}
                        onChange={(e) => handleItemChange(index, 'subCategory', e.target.value)}
                        disabled={!item.category}
                        className="w-full px-3 py-2 border-2 border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 disabled:bg-gray-100"
                      >
                        <option value="">Select Sub Category</option>
                        {item.category && subCategories[item.category]?.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </td>

                    <td className="px-6 py-4">
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className={`w-full px-3 py-2 border-2 rounded-lg focus:outline-none focus:ring-2 ${
                          errors[index]?.unit
                            ? 'border-red-500 focus:ring-red-400'
                            : 'border-emerald-300 focus:ring-emerald-400'
                        }`}
                      >
                        <option value="">Select Unit</option>
                        {units.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                      {errors[index]?.unit && (
                        <p className="text-red-600 text-sm mt-1">{errors[index].unit}</p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <label className="flex items-center justify-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={(e) => handleItemChange(index, 'isActive', e.target.checked)}
                          className="w-5 h-5 accent-emerald-500"
                        />
                        <span className={`font-semibold ${item.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                          {item.isActive ? '✓' : '✗'}
                        </span>
                      </label>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRemoveRow(index)}
                        disabled={items.length === 1}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white font-bold rounded-lg shadow-md disabled:cursor-not-allowed"
                      >
                        🗑️ Remove
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-4 flex-wrap mb-8"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleAddRow}
          className="px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold rounded-xl shadow-lg"
        >
          ➕ Add Another Row
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSubmit}
          disabled={loading}
          className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl shadow-lg disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Saving...' : '✅ Save All Items'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/inventory')}
          className="px-8 py-4 bg-gray-400 hover:bg-gray-500 text-white font-bold rounded-xl shadow-lg"
        >
          ❌ Cancel
        </motion.button>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-400 rounded-xl p-6 mb-8"
      >
        <h3 className="text-lg font-bold text-yellow-900 mb-3">💡 Tips:</h3>
        <ul className="space-y-2 text-yellow-800">
          <li>✓ You can add multiple items at once - use "Add Another Row" button</li>
          <li>✓ All fields marked with asterisk (*) are mandatory</li>
          <li>✓ SKU/Code should be unique and easy to remember</li>
          <li>✓ Once saved, you can edit items from the View Master Inventory page</li>
        </ul>
      </motion.div>

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
              className="bg-white rounded-2xl p-8 shadow-2xl border-4 border-emerald-500 max-w-md mx-auto"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="text-6xl mb-4"
                >
                  ✅
                </motion.div>
                <h2 className="text-3xl font-bold text-emerald-600 mb-4">Success!</h2>
                <p className="text-gray-700 text-lg mb-6">{successMessage}</p>
                <p className="text-sm text-gray-500">Redirecting to inventory list...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
