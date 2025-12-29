import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AddToMasterInventoryModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  initialItemName = ''
}) {
  const [rows, setRows] = useState([{
    itemName: initialItemName || '',
    itemCode: '',
    category: 'Consumables',
    subCategory: 'Dental Materials',
    unit: 'Box',
    isActive: true
  }]);

  const categoryOptions = ['Consumables', 'Equipment', 'Instruments', 'Medicines', 'Supplies', 'Other'];
  const subCategoryOptions = ['Dental Materials', 'Cleaning Supplies', 'PPE', 'Sterilization', 'Office Supplies', 'Medications'];
  const unitOptions = ['Box', 'Tablet', 'Piece', 'Bottle', 'Tube', 'Pack', 'Grams', 'Liters', 'ml', 'Units'];

  const updateRow = (index, field, value) => {
    const newRows = [...rows];
    newRows[index][field] = value;
    setRows(newRows);
  };

  const addRow = () => {
    setRows([...rows, {
      itemName: '',
      itemCode: '',
      category: 'Consumables',
      subCategory: 'Dental Materials',
      unit: 'Box',
      isActive: true
    }]);
  };

  const removeRow = (index) => {
    if (rows.length > 1) {
      setRows(rows.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate rows
    const validRows = rows.filter(row => {
      return row.itemName.trim() && row.itemCode.trim() && row.category && row.unit;
    });

    if (validRows.length === 0) {
      alert('Please fill all required fields (*) for at least one item');
      return;
    }

    // Call the submit handler with validated rows
    await onSubmit(validRows);
    
    // Reset form
    setRows([{
      itemName: '',
      itemCode: '',
      category: 'Consumables',
      subCategory: 'Dental Materials',
      unit: 'Box',
      isActive: true
    }]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
            role="document"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 sticky top-0 z-10 flex items-center justify-between">
              <div>
                <h2 id="modal-title" className="text-2xl font-bold text-white flex items-center gap-2">
                  <span>📦</span> Add Items to Master Inventory
                </h2>
                <p className="text-purple-100 text-sm mt-1">
                  Add one or more items to your master inventory catalog
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-purple-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
                aria-label="Close modal"
                type="button"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {/* Instructions */}
              <div className="mb-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">ℹ️ Instructions:</span> Fill in all required fields (*) for each item. 
                  You can add multiple items at once. These items will be added to your master inventory and will 
                  be available for selection in clinic inventories.
                </p>
              </div>

              {/* Table */}
              <div className="mb-6 overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b-2 border-purple-300 bg-purple-50">
                      <th className="text-left p-3 font-semibold text-gray-700">Item Name *</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Item Code (SKU) *</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Category *</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Sub Category</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Unit *</th>
                      <th className="text-left p-3 font-semibold text-gray-700">Active</th>
                      <th className="text-center p-3 font-semibold text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        {/* Item Name */}
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.itemName}
                            onChange={(e) => updateRow(index, 'itemName', e.target.value)}
                            placeholder="e.g., Dental Floss"
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          />
                        </td>

                        {/* Item Code */}
                        <td className="p-3">
                          <input
                            type="text"
                            value={row.itemCode}
                            onChange={(e) => updateRow(index, 'itemCode', e.target.value)}
                            placeholder="e.g., SKU-001"
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          />
                        </td>

                        {/* Category */}
                        <td className="p-3">
                          <select
                            value={row.category}
                            onChange={(e) => updateRow(index, 'category', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          >
                            {categoryOptions.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>

                        {/* Sub Category */}
                        <td className="p-3">
                          <select
                            value={row.subCategory}
                            onChange={(e) => updateRow(index, 'subCategory', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          >
                            {subCategoryOptions.map(subCat => (
                              <option key={subCat} value={subCat}>{subCat}</option>
                            ))}
                          </select>
                        </td>

                        {/* Unit */}
                        <td className="p-3">
                          <select
                            value={row.unit}
                            onChange={(e) => updateRow(index, 'unit', e.target.value)}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm"
                          >
                            {unitOptions.map(unit => (
                              <option key={unit} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </td>

                        {/* Is Active */}
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={row.isActive}
                            onChange={(e) => updateRow(index, 'isActive', e.target.checked)}
                            className="w-5 h-5 rounded cursor-pointer accent-purple-600"
                          />
                        </td>

                        {/* Action */}
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            disabled={rows.length === 1}
                            className={`font-bold text-lg transition-colors ${
                              rows.length === 1
                                ? 'text-gray-300 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-700'
                            }`}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Row Button */}
              <div className="mb-6 flex gap-4">
                <button
                  type="button"
                  onClick={addRow}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white px-4 py-3 rounded-lg font-semibold transition-all"
                >
                  ➕ Add Another Row
                </button>
                <div className="flex-1 bg-gray-100 rounded-lg p-3 flex items-center justify-center text-sm text-gray-600 font-medium">
                  Total Items to Add: <span className="ml-2 font-bold text-lg text-gray-900">{rows.length}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <span>{isLoading ? 'Adding to Master...' : '💾 Save to Master Inventory'}</span>
                  {isLoading && <span className="animate-spin">⏳</span>}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
