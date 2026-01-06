import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { updateAsset } from '../api/hmsApi';

const EditAssetModal = ({ asset, onAssetUpdated, onClose }) => {
  const [formData, setFormData] = useState({
    equipment: '',
    serialNumber: '',
    purchaseDate: '',
    lastMaintenance: '',
    nextMaintenance: '',
    status: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusOptions = ['Operational', 'Under Maintenance', 'Inactive', 'Retired'];

  useEffect(() => {
    if (asset) {
      setFormData({
        equipment: asset.equipment || '',
        serialNumber: asset.serialNumber || '',
        purchaseDate: asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '',
        lastMaintenance: asset.lastMaintenance ? asset.lastMaintenance.split('T')[0] : '',
        nextMaintenance: asset.nextMaintenance ? asset.nextMaintenance.split('T')[0] : '',
        status: asset.status || 'Operational'
      });
    }
  }, [asset]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.equipment.trim()) {
      setError('Equipment name is required');
      return false;
    }
    if (!formData.serialNumber.trim()) {
      setError('Serial number is required');
      return false;
    }
    if (!formData.purchaseDate) {
      setError('Purchase date is required');
      return false;
    }
    if (!formData.status) {
      setError('Status is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const updatePayload = {
        assetID: asset.assetID,
        enterpriseID: asset.enterpriseID,
        clinicID: asset.clinicID,
        equipment: formData.equipment,
        serialNumber: formData.serialNumber,
        purchaseDate: formData.purchaseDate,
        lastMaintenance: formData.lastMaintenance || null,
        nextMaintenance: formData.nextMaintenance || null,
        status: formData.status
      };

      await updateAsset(asset.assetID, updatePayload);
      
      // Prepare updated asset object
      const updatedAsset = {
        ...asset,
        ...updatePayload
      };

      onAssetUpdated(updatedAsset);
    } catch (err) {
      console.error('Error updating asset:', err);
      setError(err.message || 'Failed to update asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <motion.div
      variants={backdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        variants={modalVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Edit Asset</h2>
            <p className="text-blue-100 text-sm mt-1">Update asset information</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg p-2 transition text-2xl"
          >
            ✕
          </motion.button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Equipment Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Equipment Name *
            </label>
            <input
              type="text"
              name="equipment"
              value={formData.equipment}
              onChange={handleInputChange}
              placeholder="e.g., Dental Chair A, Suction Unit"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Serial Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Serial Number *
            </label>
            <input
              type="text"
              name="serialNumber"
              value={formData.serialNumber}
              onChange={handleInputChange}
              placeholder="e.g., SN-2024-001"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Purchase Date *
            </label>
            <input
              type="date"
              name="purchaseDate"
              value={formData.purchaseDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Last Maintenance */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Last Maintenance (Optional)
            </label>
            <input
              type="date"
              name="lastMaintenance"
              value={formData.lastMaintenance}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Next Maintenance */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Next Maintenance (Optional)
            </label>
            <input
              type="date"
              name="nextMaintenance"
              value={formData.nextMaintenance}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition"
            >
              Cancel
            </motion.button>
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg text-white font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving...
                </span>
              ) : (
                'Save Changes'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default EditAssetModal;
