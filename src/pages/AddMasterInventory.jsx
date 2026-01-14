import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { request } from '../services/apiClient';

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

  const subCategories = {
    'Equipment': ['Dental Chair', 'X-Ray Machine', 'Autoclave', 'Compressor', 'Suction Unit'],
    'Materials': ['Cements', 'Composites', 'Acrylics', 'Bonding Agents', 'Impression Materials'],
    'Medication': ['Antibiotics', 'Analgesics', 'Antiinflammatories', 'Anthelmintic', 'Antacids'],
    'Consumables': ['Gauze', 'Cotton', 'Gloves', 'Masks', 'Disposables'],
    'Instruments': ['Scalers', 'Mirrors', 'Explorers', 'Forceps', 'Elevators'],
    'Supplies': ['General Supplies', 'Office Supplies', 'Cleaning Materials', 'Safety Equipment']
  };

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
    setItems([...items, {
      itemName: '',
      itemCode: '',
      category: '',
      subCategory: '',
      unit: '',
      isActive: true
    }]);
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
    if (field === 'category') {
      updatedItems[index].subCategory = '';
    }
    setItems(updatedItems);
  };

  const handleSubmit = async () => {
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
      const endpoint = items.length === 1 
        ? '/Inventory/AddInventoryMasterItem' 
        : '/Inventory/AddInventoryMasterItemsBulk';
      
      const payload = items.length === 1 ? items[0] : items;

      await request(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setSuccessMessage(`Successfully added ${items.length} inventory item(s)`);
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/superadmin');
      }, 2500);
    } catch (error) {
      alert(`Error: ${error?.message || 'Failed to add items'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center gap-4 mb-4">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/superadmin')}
            className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            <span className="text-2xl">←</span>
          </motion.button>
          <div>
            <h1 className="text-4xl font-bold text-white">
              ➕ Add Master Inventory Items
            </h1>
            <p className="text-slate-400 mt-2">Add multiple inventory items in bulk to your master catalog</p>
          </div>
        </div>
      </motion.div>

      {/* Items Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50 mb-8"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-violet-600 to-purple-600 text-white border-b border-slate-700">
                <th className="px-6 py-4 text-left font-bold">Item Name</th>
                <th className="px-6 py-4 text-left font-bold">SKU/Code</th>
                <th className="px-6 py-4 text-left font-bold">Category</th>
                <th className="px-6 py-4 text-left font-bold">Sub Category</th>
                <th className="px-6 py-4 text-left font-bold">Unit</th>
                <th className="px-6 py-4 text-center font-bold">Active</th>
                <th className="px-6 py-4 text-center font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {items.map((item, index) => (
                  <motion.tr
                    key={index}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                      errors[index] ? 'bg-red-900/20' : ''
                    }`}
                  >
                    {/* Item Name */}
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="e.g., Composite Resin"
                        value={item.itemName}
                        onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                        className={`w-full px-3 py-2 text-sm bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition ${
                          errors[index]?.itemName ? 'border-red-500' : 'border-slate-600'
                        }`}
                      />
                      {errors[index]?.itemName && (
                        <p className="text-red-400 text-xs mt-1">{errors[index].itemName}</p>
                      )}
                    </td>

                    {/* SKU/Code */}
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="e.g., CR-001"
                        value={item.itemCode}
                        onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                        className={`w-full px-3 py-2 text-sm bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition ${
                          errors[index]?.itemCode ? 'border-red-500' : 'border-slate-600'
                        }`}
                      />
                      {errors[index]?.itemCode && (
                        <p className="text-red-400 text-xs mt-1">{errors[index].itemCode}</p>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-6 py-4">
                      <select
                        value={item.category}
                        onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                        className={`w-full px-3 py-2 text-sm bg-slate-700/50 border rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition ${
                          errors[index]?.category ? 'border-red-500' : 'border-slate-600'
                        }`}
                      >
                        <option value="">Select Category</option>
                        {['Supplies', 'Equipment', 'Medication', 'Consumables', 'Instruments'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      {errors[index]?.category && (
                        <p className="text-red-400 text-xs mt-1">{errors[index].category}</p>
                      )}
                    </td>

                    {/* Sub Category */}
                    <td className="px-6 py-4">
                      <select
                        value={item.subCategory}
                        onChange={(e) => handleItemChange(index, 'subCategory', e.target.value)}
                        disabled={!item.category}
                        className="w-full px-3 py-2 text-sm bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="">
                          {item.category ? 'Select Sub-Category' : 'Select Category First'}
                        </option>
                        {item.category && subCategories[item.category]?.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </td>

                    {/* Unit */}
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        placeholder="e.g., Box, Piece, Bottle"
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className={`w-full px-3 py-2 text-sm bg-slate-700/50 border rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition ${
                          errors[index]?.unit ? 'border-red-500' : 'border-slate-600'
                        }`}
                      />
                      {errors[index]?.unit && (
                        <p className="text-red-400 text-xs mt-1">{errors[index].unit}</p>
                      )}
                    </td>

                    {/* Active Checkbox */}
                    <td className="px-6 py-4 text-center">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={(e) => handleItemChange(index, 'isActive', e.target.checked)}
                          className="w-5 h-5 rounded border-slate-500 text-violet-500 focus:ring-2 focus:ring-violet-500"
                        />
                      </label>
                    </td>

                    {/* Action Button */}
                    <td className="px-6 py-4 text-center">
                      {items.length > 1 && (
                        <motion.button
                          onClick={() => handleRemoveRow(index)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-3 py-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg text-sm font-semibold border border-red-500/50 transition"
                        >
                          🗑️ Remove
                        </motion.button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Add Another Row Button */}
      <motion.button
        onClick={handleAddRow}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full py-3 mb-6 border-2 border-dashed border-violet-400/50 text-violet-400 rounded-lg hover:bg-violet-500/10 transition-colors font-semibold"
      >
        ➕ Add Another Row
      </motion.button>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4 mb-8"
      >
        <p className="text-blue-300 font-semibold">💡 Tips:</p>
        <ul className="text-blue-300/80 text-sm mt-2 space-y-1">
          <li>✓ You can add multiple items at once - use "Add Another Row" button</li>
          <li>✓ Select a category to enable sub-category dropdown</li>
          <li>✓ Check the Active checkbox to mark items as active</li>
          <li>✓ All fields except Sub-Category are required</li>
        </ul>
      </motion.div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <motion.button
          onClick={() => navigate('/superadmin')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 rounded-lg border border-slate-600 text-slate-300 font-bold hover:bg-slate-700 transition-colors"
        >
          ❌ Cancel
        </motion.button>
        <motion.button
          onClick={handleSubmit}
          disabled={loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-3 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold hover:shadow-lg hover:shadow-violet-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '⏳ Saving...' : `✅ Save All Items (${items.length})`}
        </motion.button>
      </div>

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
              className="bg-slate-800 rounded-2xl p-8 shadow-2xl border-4 border-violet-500 max-w-md mx-auto"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="text-6xl mb-4"
                >
                  ✅
                </motion.div>
                <h2 className="text-3xl font-bold text-white mb-4">Success!</h2>
                <p className="text-slate-300 text-lg mb-6">{successMessage}</p>
                <p className="text-sm text-slate-400">Redirecting...</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
